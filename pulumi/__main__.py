"""
Pulumi program that deploys a containerized web service to Azure Container Instances.
"""

import pulumi_azure_native as azure_native
import pulumi

# Import the program's configuration settings.
config = pulumi.Config()

image_name = config.get("imageName")
image_tag = config.get("imageTag")
assert image_name, "imageName must be set"
assert image_tag, "imageTag must be set"

image_name_with_tag = f"{image_name}:{image_tag}"
ghcr_token = config.require_secret("ghcr_token")
assert ghcr_token, "ghcr_token must be set"

ahb_blob_container_name = config.get("ahbBlobContainerName")
assert ahb_blob_container_name, "ahbBlobContainerName must be set"

format_version_container_name = config.get("formatVersionContainerName")
assert format_version_container_name, "formatVersionContainerName must be set"

container_port = config.get_int("containerPort")
assert container_port, "containerPort must be set"

bedingungsbaum_base_url = config.get("bedingungsbaumBaseUrl")
assert bedingungsbaum_base_url, "bedingungsbaumBaseUrl must be set"

ebd_base_url = config.get("ebdBaseUrl")
assert ebd_base_url, "ebdBaseUrl must be set"

environment = config.get("environment")
assert environment, "environment must be set"

websites_container_start_time_limit = config.get("websitesContainerStartTimeLimit")
assert websites_container_start_time_limit, "websitesContainerStartTimeLimit must be set"

oh_dear_health_check_secret = config.get("ohDearHealthCheckSecret")
assert oh_dear_health_check_secret, "ohDearHealthCheckSecret must be set"

cpu = config.get_int("cpu", 1)
memory = config.get_int("memory", 2)

# Create an Azure Resource Group
resource_group = azure_native.resources.ResourceGroup("ahb-tabellen")

# Create an Azure Storage Account
storage_account = azure_native.storage.StorageAccount(
    "ahbtabellen",
    resource_group_name=resource_group.name,
    sku=azure_native.storage.SkuArgs(
        name=azure_native.storage.SkuName.STANDARD_LRS,
    ),
    kind=azure_native.storage.Kind.STORAGE_V2,
)

# Create an Azure Blob Container
blob_container = azure_native.storage.BlobContainer(
    ahb_blob_container_name,
    resource_group_name=resource_group.name,
    account_name=storage_account.name,
    public_access=azure_native.storage.PublicAccess.NONE,
)

# Securely retrieve the primary storage account key
primary_key = pulumi.Output.all(resource_group.name, storage_account.name).apply(
    lambda args: azure_native.storage.list_storage_account_keys(
        resource_group_name=args[0], account_name=args[1]
    )
    .keys[0]
    .value
)

# Generate the connection string securely
azure_blob_storage_connection_string = pulumi.Output.all(
    storage_account.name, primary_key
).apply(
    lambda args: f"DefaultEndpointsProtocol=https;AccountName={args[0]};AccountKey={args[1]};EndpointSuffix=core.windows.net"
)

# Create an App Service Plan
app_service_plan = azure_native.web.AppServicePlan(
    "ahb-tabellen-plan",
    resource_group_name=resource_group.name,
    kind="Linux",
    reserved=True,  # Required for Linux App Service Plans, see https://stackoverflow.com/questions/66520937/pulumi-azure-native-provider-azure-webapp-the-parameter-linuxfxversion-has-an
    sku=azure_native.web.SkuDescriptionArgs(
        name="B1",
        tier="Basic",
    ),
)

# Create a Web App
web_app = azure_native.web.WebApp(
    "ahb-tabellen",
    resource_group_name=resource_group.name,
    server_farm_id=app_service_plan.id,
    site_config=azure_native.web.SiteConfigArgs(
        app_settings=[
            azure_native.web.NameValuePairArgs(
                name="DOCKER_REGISTRY_SERVER_URL", value="https://ghcr.io"
            ),
            azure_native.web.NameValuePairArgs(
                name="DOCKER_REGISTRY_SERVER_USERNAME", value="hf-krechan"
            ),  # Provide GitHub username
            azure_native.web.NameValuePairArgs(
                name="DOCKER_REGISTRY_SERVER_PASSWORD", value=ghcr_token
            ),  # Provide GitHub token or PAT
            azure_native.web.NameValuePairArgs(name="PORT", value=str(container_port)),
            azure_native.web.NameValuePairArgs(
                name="AZURE_BLOB_STORAGE_CONNECTION_STRING",
                value=azure_blob_storage_connection_string,
            ),
            azure_native.web.NameValuePairArgs(
                name="AHB_CONTAINER_NAME", value=ahb_blob_container_name
            ),
            azure_native.web.NameValuePairArgs(
                name="FORMAT_VERSION_CONTAINER_NAME",
                value=format_version_container_name,
            ),
            azure_native.web.NameValuePairArgs(
                name="BEDINGUNGSBAUM_BASE_URL", value=bedingungsbaum_base_url
            ),
            azure_native.web.NameValuePairArgs(
                name="EBD_BASE_URL", value=ebd_base_url
            ),
            azure_native.web.NameValuePairArgs(name="ENVIRONMENT", value=environment),
            azure_native.web.NameValuePairArgs(name="WEBSITES_CONTAINER_START_TIME_LIMIT", value=websites_container_start_time_limit),
            azure_native.web.NameValuePairArgs(name="OH_DEAR_HEALTH_CHECK_SECRET", value=oh_dear_health_check_secret),
        ],
        linux_fx_version=f"DOCKER|{image_name_with_tag}",
    ),
)

# Export the endpoint of the web app
pulumi.export("endpoint", web_app.default_host_name)
