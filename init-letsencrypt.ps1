# PowerShell script to initialize Let's Encrypt certificates

$domains = @("uitmmart.site", "www.uitmmart.site")
$email = "hazrulsehebat@gmail.com"
$staging = 0 # Set to 1 if you're testing your setup to avoid hitting request limits

$data_path = "./certbot"

# Create necessary directories
if (-not (Test-Path $data_path)) {
    New-Item -Path $data_path -ItemType Directory -Force
}

if (-not (Test-Path "$data_path/conf")) {
    New-Item -Path "$data_path/conf" -ItemType Directory -Force
}

if (-not (Test-Path "$data_path/www")) {
    New-Item -Path "$data_path/www" -ItemType Directory -Force
}

# Create directory structure for the first domain
$domain = $domains[0]
if (-not (Test-Path "$data_path/conf/live/$domain")) {
    New-Item -Path "$data_path/conf/live/$domain" -ItemType Directory -Force
}

Write-Host "### Starting nginx ..."
docker-compose up --force-recreate -d nginx

Write-Host "### Requesting Let's Encrypt certificate for $domains ..."

$domain_args = ""
foreach ($d in $domains) {
    $domain_args += "-d $d "
}

$email_arg = "--email $email"
$staging_arg = ""
if ($staging -eq 1) {
    $staging_arg = "--staging"
}

# Request the certificate
$cmd = "docker-compose run --rm --entrypoint `"certbot certonly --webroot -w /var/www/certbot $staging_arg $email_arg $domain_args --rsa-key-size 4096 --agree-tos --force-renewal`" certbot"
Write-Host $cmd
Invoke-Expression $cmd

Write-Host "### Reloading nginx ..."
docker-compose exec nginx nginx -s reload 