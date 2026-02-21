$PROJECT_ID = "manifest-life-487508-k5"
$REGION = "europe-west3"
$SERVICE_NAME = "snapyourdate-website"
$IMAGE_NAME = "europe-west3-docker.pkg.dev/$PROJECT_ID/provisional-repo/$SERVICE_NAME"

Write-Host "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

Write-Host "Submitting build to Cloud Build..."
gcloud builds submit --tag $IMAGE_NAME

Write-Host "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME --image $IMAGE_NAME --platform managed --region $REGION --allow-unauthenticated

Write-Host "Deployment complete."
