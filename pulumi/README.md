# Pulumi

Pulumi is a modern infrastructure as code tool that allows you to create, deploy, and manage infrastructure on any cloud using your favorite language.

We chose Python.

## Requirements

You need to have the following tools installed on your machine:

- [Pulumi](https://www.pulumi.com/docs/get-started/install/)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Python](https://www.python.org/downloads/)


## Regular Used Commands

Before you start you need to login to your pulumi account and your cloud provider.

### Login

Use the following commands to login to your pulumi account and Azure.

#### Pulumi

```bash
pulumi login
```

#### Azure
```bash
az login
```

### Apply Pulumi Changes

To apply the changes to your infrastructure use the following command.
Don't be afraid to use, it will show you the changes before applying them.

```bash
pulumi up
```

### Destroy Pulumi Resources

```bash
pulumi destroy
```

### Config Commands

#### Set Config Values

```bash
pulumi config set key value
```

#### Set Secret Config

```bash
pulumi config set --secret key value
```

#### Get Config Values

```bash
pulumi config get key
```

#### Remove Config Values

```bash
pulumi config rm key
```

### Stack Commands

#### List Stacks

```bash
pulumi stack ls
```

#### Remove a stack

```bash
pulumi stack rm
```

#### Select a stack

```bash
pulumi stack select
```

#### Get Stack Outputs

```bash
pulumi stack output
```
