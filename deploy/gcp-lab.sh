#!/usr/bin/env bash
#
# Membuat dan menghapus server uji Forum API di Google Cloud.
# Dirancang tetap di dalam kuota Always Free: e2-micro, region us-central1,
# disk pd-standard 10 GB, tanpa IP statis, tanpa Cloud SQL atau load balancer.
#
# Penggunaan:
#   GCP_PROJECT=<project-id> [GCP_ACCOUNT=<email>] bash gcp-lab.sh up|down|status
#
# VM juga dibuat dengan batas hidup 2 jam dan dihapus otomatis oleh GCP,
# sebagai pengaman bila skrip "down" lupa dijalankan.

set -euo pipefail

: "${GCP_PROJECT:?Isi GCP_PROJECT dengan project ID}"
export CLOUDSDK_CORE_PROJECT="$GCP_PROJECT"
[[ -n "${GCP_ACCOUNT:-}" ]] && export CLOUDSDK_CORE_ACCOUNT="$GCP_ACCOUNT"

ZONE="us-central1-a"
NAME="forum-api-lab"
TAG="forum-api-lab"
FIREWALL="forum-api-lab-web"
KEY="${KEY:-$HOME/.ssh/forum-api-lab}"

status() {
  echo "== VM";       gcloud compute instances list
  echo "== IP";       gcloud compute addresses list
  echo "== Disk";     gcloud compute disks list
  echo "== Firewall"; gcloud compute firewall-rules list --filter="name=$FIREWALL" --format="value(name)"
}

case "${1:-}" in
  up)
    [[ -f "$KEY" ]] || ssh-keygen -t ed25519 -N "" -q -f "$KEY"
    gcloud compute firewall-rules create "$FIREWALL" \
      --allow=tcp:80,tcp:443 --target-tags="$TAG" --quiet
    gcloud compute instances create "$NAME" \
      --zone="$ZONE" --machine-type=e2-micro \
      --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
      --boot-disk-size=10GB --boot-disk-type=pd-standard \
      --tags="$TAG" \
      --max-run-duration=2h --instance-termination-action=DELETE \
      --metadata="ssh-keys=deploy:$(cat "$KEY.pub")" --quiet
    gcloud compute instances describe "$NAME" --zone="$ZONE" \
      --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
    ;;
  down)
    gcloud compute instances delete "$NAME" --zone="$ZONE" --quiet || true
    gcloud compute firewall-rules delete "$FIREWALL" --quiet || true
    status
    ;;
  status)
    status
    ;;
  *)
    echo "Penggunaan: GCP_PROJECT=<id> bash gcp-lab.sh up|down|status"
    exit 1
    ;;
esac
