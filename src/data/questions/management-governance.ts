import type { Question } from '../types'

export const managementGovernanceQuestions: Question[] = [
  // ---------------------------------------------------------------
  // Topic: cost-management (gov-001 – gov-008)
  // ---------------------------------------------------------------
  {
    id: 'gov-001',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'A company deploys the same virtual machine size in two different Azure regions and notices that the hourly compute rate differs between them. Which factor explains the price difference?',
    options: [
      {
        id: 'a',
        text: 'The resource group each virtual machine belongs to',
        explanation:
          'A resource group is a logical container used for organization and lifecycle management. It has no influence on the price of the resources placed inside it.',
      },
      {
        id: 'b',
        text: 'The Azure region where each virtual machine is deployed',
        explanation:
          'Pricing varies by region because Microsoft’s underlying costs (power, real estate, taxes, demand) differ per geography. The same VM size can therefore have different rates in different regions.',
      },
      {
        id: 'c',
        text: 'The name assigned to each virtual machine',
        explanation:
          'Resource names are metadata used to identify resources. Azure billing meters never take the resource name into account.',
      },
      {
        id: 'd',
        text: 'The number of tags applied to each virtual machine',
        explanation:
          'Tags are free metadata used for organization and cost reporting. Adding or removing tags never changes the rate a resource is billed at.',
      },
    ],
    correct: ['b'],
  },
  {
    id: 'gov-002',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'A startup is planning a new solution and wants to estimate its expected monthly Azure cost before creating any resources. Which tool should the team use?',
    options: [
      {
        id: 'a',
        text: 'The Azure pricing calculator',
        explanation:
          'The pricing calculator lets you assemble a hypothetical solution from Azure services and configurations and produces a cost estimate before anything is deployed, which is exactly this scenario.',
      },
      {
        id: 'b',
        text: 'Microsoft Cost Management',
        explanation:
          'Microsoft Cost Management analyzes and reports on spending for resources that already exist. It cannot estimate the cost of a solution that has not been deployed yet.',
      },
      {
        id: 'c',
        text: 'Azure Advisor',
        explanation:
          'Azure Advisor gives optimization recommendations based on the usage patterns of deployed resources, so it has nothing to analyze before a deployment exists.',
      },
      {
        id: 'd',
        text: 'Azure Monitor',
        explanation:
          'Azure Monitor collects and analyzes telemetry such as metrics and logs from running resources. It is a monitoring platform, not a cost-estimation tool.',
      },
    ],
    correct: ['a'],
  },
  {
    id: 'gov-003',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'A finance team wants to receive an automatic notification whenever spending in an Azure subscription crosses a defined monthly threshold. What should they configure?',
    options: [
      {
        id: 'a',
        text: 'An Azure Service Health alert',
        explanation:
          'Service Health alerts notify you about platform incidents and planned maintenance that affect your resources. They are unrelated to how much money a subscription spends.',
      },
      {
        id: 'b',
        text: 'An Azure Monitor metric alert on virtual machine CPU',
        explanation:
          'Metric alerts fire on resource performance telemetry such as CPU or memory. CPU usage is not a measure of subscription spending.',
      },
      {
        id: 'c',
        text: 'A budget with alert thresholds in Microsoft Cost Management',
        explanation:
          'Budgets in Microsoft Cost Management track actual and forecasted spend against a limit you define and send notifications when configured thresholds are reached, which matches the requirement exactly.',
      },
      {
        id: 'd',
        text: 'An Azure Advisor cost recommendation',
        explanation:
          'Advisor suggests ways to reduce spending, such as resizing underused VMs, but it does not watch a spending threshold or send notifications when one is crossed.',
      },
    ],
    correct: ['c'],
  },
  {
    id: 'gov-004',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'multi',
    stem: 'An architect is reviewing what drives the monthly bill for a workload running in Azure. Which of the following factors can affect the cost of Azure resources? Select three.',
    options: [
      {
        id: 'a',
        text: 'The display name of the resource group containing the workload',
        explanation:
          'Resource group names are purely organizational metadata. Billing meters are attached to resources and their usage, never to the names of their containers.',
      },
      {
        id: 'b',
        text: 'The type and size of each resource, such as the VM SKU',
        explanation:
          'Every resource type has its own pricing model, and within a type, larger SKUs with more CPU, memory, or throughput cost more. This is one of the primary cost drivers.',
      },
      {
        id: 'c',
        text: 'The region in which the resources are deployed',
        explanation:
          'The same service is priced differently across regions because Microsoft’s operating costs vary by geography, so region choice directly affects the bill.',
      },
      {
        id: 'd',
        text: 'The number of tags applied to the resources',
        explanation:
          'Tags are free metadata that help you organize and report on costs. Applying more or fewer tags never changes what a resource costs.',
      },
      {
        id: 'e',
        text: 'The amount of outbound data transferred out of Azure',
        explanation:
          'Egress bandwidth leaving Azure is metered and billed beyond a free allowance, so workloads that send large volumes of data to the internet pay more.',
      },
    ],
    correct: ['b', 'c', 'e'],
  },
  {
    id: 'gov-005',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'A retail company wants to associate every Azure resource with the department that owns it, so that monthly charges can be grouped by department in cost reports. What should the company use?',
    options: [
      {
        id: 'a',
        text: 'Management groups',
        explanation:
          'Management groups organize subscriptions into a hierarchy for applying governance at scale. They do not attach department metadata to individual resources for cost grouping.',
      },
      {
        id: 'b',
        text: 'Resource locks',
        explanation:
          'Locks protect resources from accidental deletion or modification. They carry no ownership metadata and play no role in cost reporting.',
      },
      {
        id: 'c',
        text: 'A department prefix in every resource name',
        explanation:
          'Naming conventions can hint at ownership but are error-prone, cannot always be changed later, and are not a structured field that cost reports can reliably group by.',
      },
      {
        id: 'd',
        text: 'Tags, such as department:finance, applied to each resource',
        explanation:
          'Tags are name-value metadata pairs designed exactly for this: they attach organizational context like department or cost center to resources, and cost reports can filter and group charges by tag.',
      },
    ],
    correct: ['d'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/management/tag-resources',
  },
  {
    id: 'gov-006',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'An administrator needs to review a breakdown of the past six months of Azure spending by service and see a forecast of expected future costs. Which tool provides this?',
    options: [
      {
        id: 'a',
        text: 'The Azure pricing calculator',
        explanation:
          'The pricing calculator estimates the cost of a planned configuration before deployment. It has no access to an organization’s historical spending data.',
      },
      {
        id: 'b',
        text: 'Cost analysis in Microsoft Cost Management',
        explanation:
          'Cost analysis visualizes accumulated historical spend, lets you break it down by dimensions such as service or resource group, and projects a forecast of future costs.',
      },
      {
        id: 'c',
        text: 'Azure Advisor',
        explanation:
          'Advisor recommends specific optimizations, such as buying reservations or resizing VMs, but it does not present historical spending breakdowns or cost forecasts.',
      },
      {
        id: 'd',
        text: 'Metrics explorer in Azure Monitor',
        explanation:
          'Metrics explorer charts performance telemetry such as CPU and request counts. Billing and spending data are not Azure Monitor metrics.',
      },
    ],
    correct: ['b'],
  },
  {
    id: 'gov-007',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'To save money overnight, an operations team stops (deallocates) a development virtual machine every evening. Which statement describes the billing impact while the VM is deallocated?',
    options: [
      {
        id: 'a',
        text: 'All charges associated with the virtual machine stop immediately',
        explanation:
          'Deallocating releases the compute hardware, but resources attached to the VM, such as its managed disks, still exist and continue to be billed.',
      },
      {
        id: 'b',
        text: 'The virtual machine continues to incur full compute charges until it is deleted',
        explanation:
          'A deallocated VM releases its underlying compute capacity, so per-hour compute billing stops. Only a VM that is stopped inside the OS without being deallocated keeps incurring compute charges.',
      },
      {
        id: 'c',
        text: 'Compute charges stop, but the VM’s disks continue to accrue storage charges',
        explanation:
          'Deallocation ends the per-hour compute meter, yet the managed disks are retained so the VM can start again later, and that stored data is still billed.',
      },
      {
        id: 'd',
        text: 'Compute billing continues at a reduced rate while the VM is deallocated',
        explanation:
          'There is no discounted compute rate for deallocated VMs. Compute billing simply stops entirely; what remains is billing for retained resources such as disks.',
      },
    ],
    correct: ['c'],
  },
  {
    id: 'gov-008',
    domain: 'management-governance',
    topic: 'cost-management',
    kind: 'single',
    stem: 'A manufacturing firm runs a set of production virtual machines that will operate continuously for at least the next three years. Which purchasing option can significantly reduce the compute cost of these VMs?',
    options: [
      {
        id: 'a',
        text: 'Purchase Azure Reservations for the virtual machines',
        explanation:
          'Reservations exchange a one- or three-year usage commitment for a substantial discount compared with pay-as-you-go rates, which fits steady, predictable workloads like these.',
      },
      {
        id: 'b',
        text: 'Switch the VMs to Azure Spot Virtual Machines',
        explanation:
          'Spot VMs are deeply discounted but can be evicted whenever Azure needs the capacity back, which makes them unsuitable for production workloads that must run continuously.',
      },
      {
        id: 'c',
        text: 'Keep the VMs on standard pay-as-you-go pricing',
        explanation:
          'Pay-as-you-go is the most flexible but also the most expensive rate for always-on workloads, because it includes no commitment-based discount.',
      },
      {
        id: 'd',
        text: 'Recreate the VMs under an Azure free account',
        explanation:
          'The free account offers limited credits and small free service tiers intended for learning and evaluation. It is not a pricing option for sustained production compute.',
      },
    ],
    correct: ['a'],
  },

  // ---------------------------------------------------------------
  // Topic: governance-compliance (gov-009 – gov-016)
  // ---------------------------------------------------------------
  {
    id: 'gov-009',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'A multinational company wants a unified solution to discover, catalog, and classify data stored across its on-premises systems, multiple clouds, and SaaS applications. Which Microsoft service should it use?',
    options: [
      {
        id: 'a',
        text: 'Azure Policy',
        explanation:
          'Azure Policy evaluates resource configurations against organizational rules. It governs how resources are configured, not where data lives or how it is classified.',
      },
      {
        id: 'b',
        text: 'Azure Monitor',
        explanation:
          'Azure Monitor collects metrics and logs to track the health and performance of applications and infrastructure. It has no data-cataloging or classification capabilities.',
      },
      {
        id: 'c',
        text: 'Microsoft Defender for Cloud',
        explanation:
          'Defender for Cloud focuses on security posture management and threat protection for workloads. It does not build a governed map or catalog of an organization’s data estate.',
      },
      {
        id: 'd',
        text: 'Microsoft Purview',
        explanation:
          'Purview provides unified data governance: automated data discovery, a searchable data catalog, and sensitive-data classification across on-premises, multicloud, and SaaS sources.',
      },
    ],
    correct: ['d'],
  },
  {
    id: 'gov-010',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'A company must ensure that any new resource created in its subscriptions can be deployed only to the West Europe region. Which Azure feature enforces this rule automatically at creation time?',
    options: [
      {
        id: 'a',
        text: 'Azure Policy',
        explanation:
          'Azure Policy evaluates every create or update request against assigned rules and can deny deployments that violate them, such as a resource targeting a disallowed region.',
      },
      {
        id: 'b',
        text: 'Resource locks',
        explanation:
          'Locks prevent deletion or modification of existing resources. They cannot inspect or block a new deployment based on its target region.',
      },
      {
        id: 'c',
        text: 'Azure role-based access control (RBAC)',
        explanation:
          'RBAC controls who can perform which actions on which scopes. It cannot express conditions about resource properties such as the deployment region.',
      },
      {
        id: 'd',
        text: 'Azure Advisor',
        explanation:
          'Advisor only surfaces recommendations after resources exist; it has no enforcement mechanism and cannot block a non-compliant deployment.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/azure/governance/policy/overview',
  },
  {
    id: 'gov-011',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'An administrator wants to prevent anyone, including subscription owners, from accidentally deleting a production storage account, while still allowing its configuration to be updated. What should the administrator apply?',
    options: [
      {
        id: 'a',
        text: 'A ReadOnly lock on the storage account',
        explanation:
          'A ReadOnly lock blocks modifications as well as deletion, which would prevent the configuration updates the scenario explicitly wants to keep allowing.',
      },
      {
        id: 'b',
        text: 'An Azure Policy assignment with the audit effect',
        explanation:
          'An audit policy only records non-compliance for reporting; it never blocks any operation, so it cannot stop a deletion.',
      },
      {
        id: 'c',
        text: 'A CanNotDelete lock on the storage account',
        explanation:
          'A CanNotDelete lock allows authorized users to read and modify the resource but blocks delete operations for everyone, including owners, until the lock is removed.',
      },
      {
        id: 'd',
        text: 'The Reader role assigned to all users',
        explanation:
          'Making everyone a Reader would remove their ability to modify the account too, and role assignments can be changed back by owners, so this is neither precise nor a deletion safeguard.',
      },
    ],
    correct: ['c'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources',
  },
  {
    id: 'gov-012',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'A team applies a ReadOnly lock to a resource group. Which action remains possible on the resources in that group?',
    options: [
      {
        id: 'a',
        text: 'Resizing a virtual machine in the group',
        explanation:
          'Resizing is an update operation, and a ReadOnly lock blocks all create, update, and delete operations on the locked scope.',
      },
      {
        id: 'b',
        text: 'Viewing the configuration of resources in the group',
        explanation:
          'A ReadOnly lock restricts authorized users to read operations only, so browsing and inspecting resource configurations continues to work normally.',
      },
      {
        id: 'c',
        text: 'Deleting a storage account in the group',
        explanation:
          'Deletion is blocked by both lock types. ReadOnly is even stricter than CanNotDelete, so removing resources is not possible while the lock exists.',
      },
      {
        id: 'd',
        text: 'Creating a new resource inside the group',
        explanation:
          'Creating a resource is a write operation against the locked resource group, and write operations are exactly what a ReadOnly lock prevents.',
      },
    ],
    correct: ['b'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources',
  },
  {
    id: 'gov-013',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'multi',
    stem: 'A governance team is evaluating Azure Policy. Which two capabilities does Azure Policy provide? Select two.',
    options: [
      {
        id: 'a',
        text: 'Granting users permission to manage resources',
        explanation:
          'Assigning permissions is the job of Azure role-based access control (RBAC). Azure Policy governs what resource configurations are allowed, not who can act on resources.',
      },
      {
        id: 'b',
        text: 'Auditing existing resources and reporting which ones are non-compliant',
        explanation:
          'Policy continuously evaluates resources that already exist against assigned definitions and shows compliance results, so teams can find configuration drift.',
      },
      {
        id: 'c',
        text: 'Preventing a resource from being accidentally deleted',
        explanation:
          'Protection against accidental deletion is provided by resource locks (CanNotDelete or ReadOnly), which are a separate governance feature from Azure Policy.',
      },
      {
        id: 'd',
        text: 'Denying the creation of resources that violate organizational rules',
        explanation:
          'With a deny effect, Policy blocks create or update requests that do not meet the assigned rules, enforcing standards at deployment time.',
      },
    ],
    correct: ['b', 'd'],
    learnMore: 'https://learn.microsoft.com/azure/governance/policy/overview',
  },
  {
    id: 'gov-014',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'A governance lead wants to bundle several related Azure Policy definitions, such as a set of tagging and location rules, so they can be assigned and tracked as a single unit. What is this grouping called?',
    options: [
      {
        id: 'a',
        text: 'A management group',
        explanation:
          'A management group is a scope that organizes subscriptions in a hierarchy. It is a place where policies can be assigned, not a bundle of policy definitions.',
      },
      {
        id: 'b',
        text: 'A resource group',
        explanation:
          'A resource group is a container for resources that share a lifecycle. It has nothing to do with combining policy definitions.',
      },
      {
        id: 'c',
        text: 'A subscription',
        explanation:
          'A subscription is a billing and management boundary that can be a policy assignment scope, but it does not group policy definitions together.',
      },
      {
        id: 'd',
        text: 'An initiative',
        explanation:
          'An initiative (also called a policy set) collects multiple policy definitions so they can be assigned together and their compliance evaluated as one unit.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/governance/policy/overview',
  },
  {
    id: 'gov-015',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'An administrator applies a CanNotDelete lock to a resource group that contains 20 resources. What is the effect on the resources inside the group?',
    options: [
      {
        id: 'a',
        text: 'All resources in the group inherit the lock and cannot be deleted',
        explanation:
          'Locks applied at a parent scope are inherited by everything within it, so every resource in the group is protected from deletion while the lock exists.',
      },
      {
        id: 'b',
        text: 'Only the resource group itself is protected; the individual resources can still be deleted',
        explanation:
          'Lock inheritance flows down to child resources, so the protection is not limited to the container. The resources inside are covered by the same lock.',
      },
      {
        id: 'c',
        text: 'The lock applies only to resources created after it was added',
        explanation:
          'A lock takes effect on the entire scope immediately, covering resources that already exist as well as any created later; there is no created-after condition.',
      },
      {
        id: 'd',
        text: 'The resources become read-only and can no longer be modified',
        explanation:
          'Blocking modifications is the behavior of a ReadOnly lock. A CanNotDelete lock still permits reads and updates and blocks only delete operations.',
      },
    ],
    correct: ['a'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/management/lock-resources',
  },
  {
    id: 'gov-016',
    domain: 'management-governance',
    topic: 'governance-compliance',
    kind: 'single',
    stem: 'Which statement best describes the purpose of Microsoft Purview?',
    options: [
      {
        id: 'a',
        text: 'It enforces organizational standards by evaluating Azure resources against configuration rules',
        explanation:
          'Enforcing configuration rules on resources is the purpose of Azure Policy. Purview is concerned with governing data, not resource configurations.',
      },
      {
        id: 'b',
        text: 'It provides unified data governance, risk, and compliance capabilities across an organization’s data estate',
        explanation:
          'Purview brings together data governance (discovery, cataloging, classification) with risk and compliance solutions, giving organizations a comprehensive view of their data wherever it resides.',
      },
      {
        id: 'c',
        text: 'It recommends ways to optimize the cost and performance of deployed Azure resources',
        explanation:
          'Personalized optimization recommendations for deployed resources come from Azure Advisor, not from Purview.',
      },
      {
        id: 'd',
        text: 'It collects and analyzes telemetry from applications and infrastructure',
        explanation:
          'Telemetry collection and analysis is the role of Azure Monitor. Purview does not gather metrics or logs from workloads.',
      },
    ],
    correct: ['b'],
  },

  // ---------------------------------------------------------------
  // Topic: managing-deploying-resources (gov-017 – gov-024)
  // ---------------------------------------------------------------
  {
    id: 'gov-017',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'A newly hired administrator wants to build, manage, and monitor Azure resources through a web-based graphical interface without writing any commands or scripts. Which tool should the administrator use?',
    options: [
      {
        id: 'a',
        text: 'Azure CLI',
        explanation:
          'The Azure CLI is a command-line tool driven by typed az commands, which is exactly the scripting-style experience this administrator wants to avoid.',
      },
      {
        id: 'b',
        text: 'Azure PowerShell',
        explanation:
          'Azure PowerShell manages resources through cmdlets entered in a shell or scripts, so it is a command-driven tool rather than a graphical one.',
      },
      {
        id: 'c',
        text: 'The Azure portal',
        explanation:
          'The Azure portal is the web-based graphical console for Azure, offering dashboards, blades, and wizards to create and manage resources with no scripting required.',
      },
      {
        id: 'd',
        text: 'ARM templates',
        explanation:
          'ARM templates are declarative code files used to deploy infrastructure. Authoring JSON templates is the opposite of a point-and-click graphical experience.',
      },
    ],
    correct: ['c'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-portal/azure-portal-overview',
  },
  {
    id: 'gov-018',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'An engineer is working from a locked-down computer where no software can be installed but a web browser is available. The engineer needs to run az commands to manage Azure resources. What should the engineer use?',
    options: [
      {
        id: 'a',
        text: 'Azure Cloud Shell',
        explanation:
          'Cloud Shell is a browser-based shell, reachable from the Azure portal, with the Azure CLI and Azure PowerShell preinstalled and authenticated, so nothing needs to be installed locally.',
      },
      {
        id: 'b',
        text: 'The Azure CLI installed on the local computer',
        explanation:
          'A local Azure CLI would work in principle, but the scenario states that no software can be installed on the machine, which rules out a local installation.',
      },
      {
        id: 'c',
        text: 'The Azure PowerShell module installed on the local computer',
        explanation:
          'Besides requiring an installation the locked-down machine does not allow, Azure PowerShell uses Verb-Noun cmdlets rather than the az commands the engineer needs to run.',
      },
      {
        id: 'd',
        text: 'Azure Storage Explorer',
        explanation:
          'Storage Explorer is a desktop application for browsing storage accounts. It must be installed and cannot run arbitrary az commands.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/azure/cloud-shell/overview',
  },
  {
    id: 'gov-019',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'multi',
    stem: 'A DevOps team wants to automate resource administration from scripts instead of clicking through the portal. Which two command-line tools can create and manage Azure resources? Select two.',
    options: [
      {
        id: 'a',
        text: 'Azure CLI',
        explanation:
          'The Azure CLI is a cross-platform command-line tool whose az commands can create, configure, and delete Azure resources, and it scripts naturally in Bash.',
      },
      {
        id: 'b',
        text: 'Azure Storage Explorer',
        explanation:
          'Storage Explorer is a graphical desktop application focused on working with storage account contents; it is not a command-line tool and does not manage arbitrary resources.',
      },
      {
        id: 'c',
        text: 'Azure PowerShell',
        explanation:
          'Azure PowerShell provides Az cmdlets that manage the full range of Azure resources and can be combined into PowerShell scripts for automation.',
      },
      {
        id: 'd',
        text: 'Azure Resource Manager',
        explanation:
          'Azure Resource Manager is the underlying management layer that receives requests from tools; it is a platform service you call through other tools, not a command-line tool itself.',
      },
    ],
    correct: ['a', 'c'],
  },
  {
    id: 'gov-020',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'A logistics company runs Windows servers in its own datacenter and virtual machines in another public cloud. It wants to govern all of these machines with Azure tools such as Azure Policy, alongside its native Azure resources, without moving them. Which service enables this?',
    options: [
      {
        id: 'a',
        text: 'Azure Migrate',
        explanation:
          'Azure Migrate assesses and moves workloads into Azure. The company explicitly wants to keep the servers where they are, so a migration tool does not fit.',
      },
      {
        id: 'b',
        text: 'Azure ExpressRoute',
        explanation:
          'ExpressRoute provides a private network connection between on-premises networks and Azure. Connectivity alone does not project external servers into Azure management.',
      },
      {
        id: 'c',
        text: 'Azure Site Recovery',
        explanation:
          'Site Recovery replicates workloads for disaster recovery failover. It does not make on-premises or other-cloud machines manageable through Azure governance tools.',
      },
      {
        id: 'd',
        text: 'Azure Arc',
        explanation:
          'Azure Arc projects servers and Kubernetes clusters running outside Azure into Azure Resource Manager, so they can be organized, tagged, and governed with tools like Azure Policy just like native resources.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/azure-arc/overview',
  },
  {
    id: 'gov-021',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'multi',
    stem: 'A platform team is proposing that all environments be defined using infrastructure as code (IaC). Which two benefits does IaC provide? Select two.',
    options: [
      {
        id: 'a',
        text: 'It removes the need for role-based access control during deployments',
        explanation:
          'IaC changes how infrastructure is described, not how it is authorized. Deployments still run under identities whose permissions RBAC must grant.',
      },
      {
        id: 'b',
        text: 'Environments can be deployed repeatedly with consistent, predictable results',
        explanation:
          'Because the environment is described declaratively in code, every deployment produces the same configuration, eliminating the drift and mistakes of manual setup.',
      },
      {
        id: 'c',
        text: 'It automatically lowers the pay-as-you-go rates of the resources it deploys',
        explanation:
          'Azure prices resources the same regardless of how they were created. IaC can help avoid waste, but it does not change any billing rate.',
      },
      {
        id: 'd',
        text: 'Infrastructure definitions can be stored, versioned, and reviewed in source control',
        explanation:
          'Treating infrastructure as code files means they can live in a repository with history, code review, and rollback, just like application code.',
      },
    ],
    correct: ['b', 'd'],
  },
  {
    id: 'gov-022',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'Whether a resource is created from the Azure portal, the Azure CLI, Azure PowerShell, or an SDK, the request is handled by a single deployment and management layer. What is this layer called?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Entra ID',
        explanation:
          'Entra ID is the identity platform that verifies who is making a request. The request itself is received and processed by the resource management layer, not by the identity service.',
      },
      {
        id: 'b',
        text: 'Azure Resource Manager',
        explanation:
          'Azure Resource Manager (ARM) is the unified management layer: every tool sends its requests to ARM, which authenticates and authorizes them before performing the requested operation.',
      },
      {
        id: 'c',
        text: 'Azure Monitor',
        explanation:
          'Azure Monitor observes resources by collecting metrics and logs after they exist. It does not receive or process create, update, or delete requests.',
      },
      {
        id: 'd',
        text: 'Azure Advisor',
        explanation:
          'Advisor analyzes deployed resources to produce recommendations. It plays no part in handling management requests from tools or SDKs.',
      },
    ],
    correct: ['b'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/management/overview',
  },
  {
    id: 'gov-023',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'A DevOps engineer wants to describe an entire environment in a declarative JSON file so that identical copies of the environment can be deployed on demand. Which option meets this requirement?',
    options: [
      {
        id: 'a',
        text: 'An imperative Bash script that calls the Azure CLI',
        explanation:
          'A CLI script lists step-by-step commands rather than declaring an end state, and it is Bash rather than a declarative JSON document, so it does not match the requirement.',
      },
      {
        id: 'b',
        text: 'Manual deployment through the Azure portal',
        explanation:
          'Portal deployments are interactive and hard to repeat identically; nothing is captured in a reusable file, so consistency across copies cannot be guaranteed.',
      },
      {
        id: 'c',
        text: 'An ARM template',
        explanation:
          'ARM templates are declarative JSON files that state the desired resources and their properties; Azure Resource Manager deploys them repeatably, producing identical environments each time.',
      },
      {
        id: 'd',
        text: 'An Azure Policy definition',
        explanation:
          'Policy definitions are JSON, but they describe compliance rules to evaluate resources against; they cannot be used to deploy an environment.',
      },
    ],
    correct: ['c'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/templates/overview',
  },
  {
    id: 'gov-024',
    domain: 'management-governance',
    topic: 'managing-deploying-resources',
    kind: 'single',
    stem: 'A team finds ARM template JSON verbose and wants a Microsoft-provided declarative language with simpler syntax that offers the same deployment capabilities on Azure Resource Manager. Which language should the team adopt?',
    options: [
      {
        id: 'a',
        text: 'Bicep',
        explanation:
          'Bicep is Microsoft’s domain-specific language for ARM deployments: it has a cleaner syntax than template JSON and supports the same resource types and capabilities, deploying through the same Resource Manager.',
      },
      {
        id: 'b',
        text: 'Terraform',
        explanation:
          'Terraform is a widely used third-party IaC tool with its own HCL language and state model; it is not the Microsoft-provided language built directly on ARM templates.',
      },
      {
        id: 'c',
        text: 'Kusto Query Language (KQL)',
        explanation:
          'KQL is the query language used to analyze log data in tools such as Log Analytics. It queries data and cannot deploy infrastructure.',
      },
      {
        id: 'd',
        text: 'Azure PowerShell',
        explanation:
          'Azure PowerShell is an imperative command-line tool based on cmdlets. It can trigger deployments but is not a declarative language that replaces template JSON.',
      },
    ],
    correct: ['a'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview',
  },

  // ---------------------------------------------------------------
  // Topic: monitoring-tools (gov-025 – gov-031)
  // ---------------------------------------------------------------
  {
    id: 'gov-025',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'A company wants free, personalized recommendations for its existing Azure resources covering cost savings, security, reliability, performance, and operational excellence. Which tool provides this?',
    options: [
      {
        id: 'a',
        text: 'Azure Service Health',
        explanation:
          'Service Health reports on Azure platform incidents and planned maintenance affecting your resources. It does not analyze your configurations to produce optimization recommendations.',
      },
      {
        id: 'b',
        text: 'The Azure pricing calculator',
        explanation:
          'The pricing calculator estimates costs for planned deployments. It knows nothing about resources that already exist and offers no recommendations.',
      },
      {
        id: 'c',
        text: 'Azure Monitor',
        explanation:
          'Azure Monitor collects and analyzes telemetry so you can observe workloads, but it does not evaluate deployments against best practices to generate recommendation lists.',
      },
      {
        id: 'd',
        text: 'Azure Advisor',
        explanation:
          'Advisor continuously analyzes resource configuration and usage and produces personalized recommendations in exactly these five categories, at no extra cost.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/advisor/advisor-overview',
  },
  {
    id: 'gov-026',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'An operations team wants a personalized view of Azure platform incidents and upcoming planned maintenance that specifically affect the services and regions their subscriptions use. Which tool should they rely on?',
    options: [
      {
        id: 'a',
        text: 'The Azure Status page',
        explanation:
          'The public status page shows the global health of Azure services for everyone; it is not filtered to the services, regions, or subscriptions a particular customer uses.',
      },
      {
        id: 'b',
        text: 'Azure Service Health',
        explanation:
          'Service Health provides a personalized dashboard of service issues, planned maintenance, and health advisories scoped to the subscriptions and regions you actually use, and it can send alerts about them.',
      },
      {
        id: 'c',
        text: 'Azure Advisor',
        explanation:
          'Advisor recommends improvements to your own resource configurations. It does not report on Azure platform outages or maintenance windows.',
      },
      {
        id: 'd',
        text: 'Azure Monitor Application Insights',
        explanation:
          'Application Insights monitors the performance and failures of your own applications, not the health of the underlying Azure platform.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/azure/service-health/overview',
  },
  {
    id: 'gov-027',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'Which Azure service provides a comprehensive platform for collecting, analyzing, and acting on metrics and logs from applications and infrastructure in Azure and on-premises environments?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Purview',
        explanation:
          'Purview governs an organization’s data estate through discovery, cataloging, and classification. It does not collect operational telemetry such as metrics and logs.',
      },
      {
        id: 'b',
        text: 'Azure Service Health',
        explanation:
          'Service Health informs you about the Azure platform’s own incidents and maintenance; it does not gather telemetry from your applications or servers.',
      },
      {
        id: 'c',
        text: 'Azure Monitor',
        explanation:
          'Azure Monitor is the full-stack monitoring platform: it collects metrics and logs from Azure, on-premises, and multicloud sources, and provides analysis, visualization, and alerting on that telemetry.',
      },
      {
        id: 'd',
        text: 'Azure Arc',
        explanation:
          'Azure Arc extends Azure management to servers and clusters outside Azure, but it is a management projection service, not the telemetry collection and analysis platform.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/azure-monitor/overview',
  },
  {
    id: 'gov-028',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'multi',
    stem: 'An architect is documenting what the Azure Monitor platform includes. Which of the following are features of Azure Monitor? Select three.',
    options: [
      {
        id: 'a',
        text: 'Log Analytics',
        explanation:
          'Log Analytics is the Azure Monitor tool for writing and running queries against collected log data, making it a core part of the platform.',
      },
      {
        id: 'b',
        text: 'Azure Advisor',
        explanation:
          'Advisor is a separate recommendation service that evaluates your deployments against best practices; it is not a component of the Azure Monitor platform.',
      },
      {
        id: 'c',
        text: 'Application Insights',
        explanation:
          'Application Insights is Azure Monitor’s application performance management (APM) feature for monitoring live web applications.',
      },
      {
        id: 'd',
        text: 'Azure Monitor alerts',
        explanation:
          'Alerts are the Azure Monitor capability that watches metric and log conditions and notifies people or triggers actions when those conditions are met.',
      },
      {
        id: 'e',
        text: 'Azure Policy',
        explanation:
          'Azure Policy is a governance service that evaluates resource configurations for compliance; it belongs to Azure governance tooling, not to Azure Monitor.',
      },
    ],
    correct: ['a', 'c', 'd'],
    learnMore: 'https://learn.microsoft.com/azure/azure-monitor/overview',
  },
  {
    id: 'gov-029',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'To troubleshoot an intermittent issue, an engineer needs to write and run Kusto Query Language (KQL) queries against log data collected from several Azure resources. Which Azure Monitor tool is designed for this?',
    options: [
      {
        id: 'a',
        text: 'Log Analytics',
        explanation:
          'Log Analytics is the workspace-backed tool in Azure Monitor for authoring and running KQL queries over collected logs, including sorting, filtering, and visualizing the results.',
      },
      {
        id: 'b',
        text: 'Application Insights',
        explanation:
          'Application Insights instruments applications to generate telemetry about requests and failures. The general-purpose tool for querying collected log data with KQL is Log Analytics.',
      },
      {
        id: 'c',
        text: 'Azure Advisor',
        explanation:
          'Advisor presents best-practice recommendations and has no query interface; you cannot run KQL against logs with it.',
      },
      {
        id: 'd',
        text: 'Azure Service Health',
        explanation:
          'Service Health tracks platform incidents and maintenance. It offers dashboards and alerts, not a log-query experience.',
      },
    ],
    correct: ['a'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-monitor/logs/log-analytics-overview',
  },
  {
    id: 'gov-030',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'A site reliability team wants an automatic email sent to on-call engineers whenever the average CPU of a production virtual machine stays above 90 percent for ten minutes. What should the team create?',
    options: [
      {
        id: 'a',
        text: 'An Azure Service Health alert',
        explanation:
          'Service Health alerts fire on Azure platform events such as outages and maintenance, not on the performance metrics of your own virtual machines.',
      },
      {
        id: 'b',
        text: 'A budget alert in Microsoft Cost Management',
        explanation:
          'Budget alerts respond to spending thresholds. CPU utilization is a performance signal that budgets never evaluate.',
      },
      {
        id: 'c',
        text: 'An Azure Advisor recommendation',
        explanation:
          'Advisor generates periodic best-practice suggestions; it cannot watch a live metric condition or notify a team the moment a threshold is breached.',
      },
      {
        id: 'd',
        text: 'An Azure Monitor metric alert with an action group',
        explanation:
          'A metric alert evaluates the CPU metric against the threshold and duration you define, and its action group delivers the notification, such as an email to the on-call engineers.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/azure-monitor/overview',
  },
  {
    id: 'gov-031',
    domain: 'management-governance',
    topic: 'monitoring-tools',
    kind: 'single',
    stem: 'A development team wants to monitor a live web application, including its request rates, response times, and failure rates, and to be alerted to performance anomalies. Which Azure Monitor feature should the team use?',
    options: [
      {
        id: 'a',
        text: 'Azure Service Health',
        explanation:
          'Service Health covers the health of the Azure platform itself. It has no visibility into the requests and response times of a customer’s application.',
      },
      {
        id: 'b',
        text: 'Application Insights',
        explanation:
          'Application Insights is the application performance management (APM) feature of Azure Monitor: it instruments live web apps to track requests, dependencies, response times, and failures, and can detect anomalies.',
      },
      {
        id: 'c',
        text: 'Azure Advisor',
        explanation:
          'Advisor reviews resource configuration and usage to suggest improvements; it does not instrument applications or measure their request-level performance.',
      },
      {
        id: 'd',
        text: 'Log Analytics',
        explanation:
          'Log Analytics is the tool for querying log data that has already been collected. On its own it does not instrument a web application with APM capabilities such as live request and failure tracking.',
      },
    ],
    correct: ['b'],
    learnMore:
      'https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview',
  },
]
