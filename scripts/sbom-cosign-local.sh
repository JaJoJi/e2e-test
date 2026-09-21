#!/usr/bin/env bash
# Local simulator for the SBOM — Syft + Cosign stage.
# Uses bind mounts (which work on Linux Jenkins agents and on this host for read-only).

set -eu

cd "$(dirname "$0")/../mini-task-manager"

# On WSL2 + Docker Desktop, the WSL docker CLI can't reach the daemon;
# use the Windows docker.exe which uses named pipes that Docker Desktop proxies.
if command -v docker.exe >/dev/null 2>&1; then
    DOCKER="/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe"
else
    DOCKER="docker"
fi
echo "Using docker binary: $DOCKER"

"$DOCKER" --version

echo "=== SBOM — Syft + Cosign (local simulator) ==="

SBOM="taskflow-api.cdx.json"
IMAGE="mtm-sbom-scan:tmp"

# Cleanup trap
KEYDIR=".sbom-keys"
cleanup() {
    rm -rf "$KEYDIR" 2>/dev/null || true
}
trap cleanup EXIT

# 1. Build SBOM scan image
echo "=== Build SBOM scan image ==="
"$DOCKER" build -t "$IMAGE" -f Dockerfile . 2>&1 | tail -3

# 2. Generate SBOM with Syft via docker create/cp/start/cp pattern
echo "=== Generate SBOM (CycloneDX) ==="
SBOM_CTR="sbom-gen-$$"
"$DOCKER" create --name "$SBOM_CTR" \
    -v /var/run/docker.sock:/var/run/docker.sock \
    anchore/syft:latest \
    scan "docker:$IMAGE" -o cyclonedx-json > /dev/null
"$DOCKER" start -a "$SBOM_CTR" > "$SBOM" 2>/dev/null
SYFT_EXIT=$?
"$DOCKER" rm "$SBOM_CTR" > /dev/null
if [ "$SYFT_EXIT" -ne 0 ]; then
    echo "ERROR: Syft scan failed (exit $SYFT_EXIT)"
    exit 1
fi
if [ ! -s "$SBOM" ]; then
    echo "ERROR: SBOM not produced"
    exit 1
fi

# Validate SBOM
node -e "
    const fs = require('fs');
    const j = JSON.parse(fs.readFileSync('$SBOM','utf8'));
    const n = (j.components||[]).length;
    if (j.bomFormat !== 'CycloneDX') {
        console.error('ERROR: SBOM is not CycloneDX (got: ' + j.bomFormat + ')');
        process.exit(1);
    }
    console.log('SBOM format      : ' + j.bomFormat);
    console.log('SBOM specVersion : ' + j.specVersion);
    console.log('SBOM components  : ' + n);
"

# 3. Generate ephemeral Cosign keypair
echo "=== Generate Cosign keypair (ephemeral) ==="
mkdir -p "$KEYDIR"
export COSIGN_PASSWORD
COSIGN_PASSWORD="lab06-$(date +%s)-$(head -c 16 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')"
echo "Generated per-build COSIGN_PASSWORD (length ${#COSIGN_PASSWORD}), not logged"

docker run --rm \
    -v "$PWD/$KEYDIR:/keys" \
    -u 0:0 \
    -e "COSIGN_PASSWORD=$COSIGN_PASSWORD" \
    gcr.io/projectsigstore/cosign:v2.4.1 \
    generate-key-pair --output-key-prefix /keys/cosign

# Promote public key out of KEYDIR so it survives trap cleanup
cp "$KEYDIR/cosign.pub" ./cosign.pub

# 4. Sign SBOM
echo "=== Sign SBOM ==="
"$DOCKER" run --rm \
    -v "$PWD:/work" \
    -u 0:0 \
    -e "COSIGN_PASSWORD=$COSIGN_PASSWORD" \
    gcr.io/projectsigstore/cosign:v2.4.1 \
    sign-blob \
        --key "/work/$KEYDIR/cosign.key" \
        --output-signature "/work/${SBOM}.sig" \
        --yes \
        "/work/$SBOM"

if [ ! -s "${SBOM}.sig" ]; then
    echo "ERROR: SBOM signature was not produced"
    exit 1
fi

# 5. Verify signature
echo "=== Verify SBOM signature ==="
"$DOCKER" run --rm \
    -v "$PWD:/work" \
    -u 0:0 \
    gcr.io/projectsigstore/cosign:v2.4.1 \
    verify-blob \
        --key /work/cosign.pub \
        --signature "/work/${SBOM}.sig" \
        "/work/$SBOM"

echo "=== SBOM + signature VERIFIED ==="

# 6. Cleanup password
unset COSIGN_PASSWORD

echo "=== Artifacts produced ==="
ls -la "$SBOM" "${SBOM}.sig" cosign.pub
echo ""
echo "=== Components ==="
node -e "
    const j = JSON.parse(require('fs').readFileSync('$SBOM','utf8'));
    console.log((j.components||[]).length + ' components');
"
