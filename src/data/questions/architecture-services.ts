import type { Question } from '../types'

export const architectureServicesQuestions: Question[] = [
  // ── Describe the core architectural components of Azure (8) ──────────────
  {
    id: 'arch-001',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'A company deploys its workload to an Azure region that Microsoft has paired with a second region. Which benefit does the region pair provide?',
    options: [
      {
        id: 'a',
        text: 'In a broad outage, recovery of one region in the pair is prioritized, and planned platform updates are rolled out to the paired regions sequentially rather than at the same time.',
        explanation:
          'These are the core benefits of region pairs: sequential platform updates reduce the chance that both regions are affected by a bad update, and Microsoft prioritizes restoring one region of the pair during a widespread outage.',
      },
      {
        id: 'b',
        text: 'All data written in one region is automatically replicated to the paired region for every Azure service.',
        explanation:
          'Only certain services replicate to the paired region, and usually only when the customer opts in (for example, geo-redundant storage). Region pairing by itself does not replicate data for every service.',
      },
      {
        id: 'c',
        text: 'Resources deployed in one region are duplicated in the partner region at no additional cost.',
        explanation:
          'Azure never deploys free duplicate resources in another region. Customers must explicitly deploy (and pay for) resources in a second region if they want cross-region redundancy.',
      },
      {
        id: 'd',
        text: 'The two regions share a single set of datacenters to lower network latency.',
        explanation:
          'Paired regions are deliberately separated, typically by hundreds of miles, precisely so they do not share datacenters or a single failure domain.',
      },
    ],
    correct: ['a'],
  },
  {
    id: 'arch-002',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'A United States federal agency requires a cloud environment that is physically isolated from the public Azure cloud and operated by screened personnel. Which offering meets this requirement?',
    options: [
      {
        id: 'a',
        text: 'Azure China operated by 21Vianet',
        explanation:
          'Azure China is a sovereign cloud, but it serves customers who must comply with Chinese regulations and is operated by 21Vianet in China, so it does not fit a US federal agency.',
      },
      {
        id: 'b',
        text: 'Azure Government',
        explanation:
          'Azure Government is a sovereign cloud with physically isolated instances of Azure, available to US government entities and their partners and operated by screened US personnel.',
      },
      {
        id: 'c',
        text: 'An Azure region pair',
        explanation:
          'Region pairs provide resilience between two public Azure regions; they offer no physical isolation from the public cloud and no special government compliance boundary.',
      },
      {
        id: 'd',
        text: 'Azure Arc',
        explanation:
          'Azure Arc extends Azure management to servers and Kubernetes clusters running outside Azure; it is a management technology, not an isolated sovereign cloud.',
      },
    ],
    correct: ['b'],
  },
  {
    id: 'arch-003',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'An operations team wants its virtual machines to keep running even if an entire datacenter within an Azure region loses power. Which Azure capability should the team use when deploying the VMs?',
    options: [
      {
        id: 'a',
        text: 'Availability sets',
        explanation:
          'Availability sets spread VMs across fault and update domains within a single datacenter, so they cannot protect against the loss of that whole datacenter.',
      },
      {
        id: 'b',
        text: 'Region pairs',
        explanation:
          'Region pairs address disasters that take out an entire region, which is broader than needed here, and using them requires deploying to a second region rather than a deployment option within one region.',
      },
      {
        id: 'c',
        text: 'Availability zones',
        explanation:
          'Availability zones are physically separate locations within a region, each with independent power, cooling, and networking, so VMs spread across zones survive the failure of a single datacenter.',
      },
      {
        id: 'd',
        text: 'Resource groups',
        explanation:
          'A resource group is a logical management container; where a resource lives physically is unaffected by which resource group holds it.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/reliability/availability-zones-overview',
  },
  {
    id: 'arch-004',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'multi',
    stem: 'Which two statements about Azure resource groups are true? Select two.',
    options: [
      {
        id: 'a',
        text: 'A resource can belong to only one resource group at a time.',
        explanation:
          'Resource group membership is exclusive: a resource always has exactly one parent resource group, although it can be moved to a different one.',
      },
      {
        id: 'b',
        text: 'Deleting a resource group deletes all of the resources it contains.',
        explanation:
          'A resource group is a lifecycle boundary, so removing the group removes everything inside it — a common reason to group resources that share a lifecycle.',
      },
      {
        id: 'c',
        text: 'A resource group can contain resources only from a single Azure region.',
        explanation:
          'The region chosen for a resource group only stores its metadata; the resources inside it can be deployed to any mix of regions.',
      },
      {
        id: 'd',
        text: 'Resource groups can be nested inside other resource groups.',
        explanation:
          'Resource groups are a flat structure and cannot contain other resource groups; hierarchy in Azure comes from management groups and subscriptions instead.',
      },
    ],
    correct: ['a', 'b'],
    learnMore: 'https://learn.microsoft.com/azure/azure-resource-manager/management/overview',
  },
  {
    id: 'arch-005',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'Which statement describes an Azure datacenter?',
    options: [
      {
        id: 'a',
        text: 'A logical container used to group related Azure resources for management',
        explanation:
          'That describes a resource group, which is a purely logical construct with no physical footprint of its own.',
      },
      {
        id: 'b',
        text: 'A boundary that keeps customer data within a specific country or market',
        explanation:
          'That describes an Azure geography, which is a data-residency and compliance boundary containing one or more regions.',
      },
      {
        id: 'c',
        text: 'A group of physical locations connected through a dedicated low-latency network',
        explanation:
          'That describes an Azure region, which is made up of one or more datacenters connected by a low-latency network.',
      },
      {
        id: 'd',
        text: 'A physical facility that houses racks of servers together with dedicated power, cooling, and networking infrastructure',
        explanation:
          'An Azure datacenter is the physical building block of the platform; regions and availability zones are composed of one or more of these facilities.',
      },
    ],
    correct: ['d'],
  },
  {
    id: 'arch-006',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'A company wants its development costs and production costs to appear on separate Azure invoices with independent billing boundaries. Which Azure construct should it use to separate the two environments?',
    options: [
      {
        id: 'a',
        text: 'Subscriptions',
        explanation:
          'A subscription is both a billing boundary and an access-management boundary, so placing development and production in different subscriptions cleanly separates their invoices.',
      },
      {
        id: 'b',
        text: 'Resource groups',
        explanation:
          'Resource groups organize resources for management, but all their costs still roll up to the subscription that contains them, so they do not create separate billing boundaries.',
      },
      {
        id: 'c',
        text: 'Management groups',
        explanation:
          'Management groups organize subscriptions to apply governance at scale; they sit above billing rather than creating invoice boundaries themselves.',
      },
      {
        id: 'd',
        text: 'Availability zones',
        explanation:
          'Availability zones are a resiliency feature that isolates infrastructure failures within a region; they have nothing to do with how usage is billed.',
      },
    ],
    correct: ['a'],
  },
  {
    id: 'arch-007',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'An enterprise has 40 Azure subscriptions and wants to apply the same governance conditions to all of them from a single place. What should it create?',
    options: [
      {
        id: 'a',
        text: 'A resource group that contains the 40 subscriptions',
        explanation:
          'Resource groups contain resources, not subscriptions, so they cannot act as a container above the subscription level.',
      },
      {
        id: 'b',
        text: 'A management group that contains the 40 subscriptions',
        explanation:
          'Management groups exist exactly for this: subscriptions placed under a management group inherit the policies and access assignments applied to that group.',
      },
      {
        id: 'c',
        text: 'A region pair covering the subscriptions',
        explanation:
          'Region pairs relate two physical regions for resilience; they are unrelated to organizing subscriptions or applying governance.',
      },
      {
        id: 'd',
        text: 'A Microsoft Entra administrative unit for the subscriptions',
        explanation:
          'Administrative units scope the management of Microsoft Entra users, groups, and devices; they do not contain Azure subscriptions or govern Azure resources.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/azure/governance/management-groups/overview',
  },
  {
    id: 'arch-008',
    domain: 'architecture-services',
    topic: 'core-architectural-components',
    kind: 'single',
    stem: 'Which option lists the levels of the Azure management hierarchy in the correct order, from the top level down?',
    options: [
      {
        id: 'a',
        text: 'Management groups, subscriptions, resource groups, resources',
        explanation:
          'This is the correct order: management groups contain subscriptions, subscriptions contain resource groups, and resource groups contain individual resources, with settings inherited downward.',
      },
      {
        id: 'b',
        text: 'Subscriptions, management groups, resource groups, resources',
        explanation:
          'A subscription cannot contain management groups; management groups sit above subscriptions to organize them.',
      },
      {
        id: 'c',
        text: 'Management groups, resource groups, subscriptions, resources',
        explanation:
          'Resource groups live inside subscriptions, so they cannot appear above subscriptions in the hierarchy.',
      },
      {
        id: 'd',
        text: 'Resource groups, subscriptions, management groups, resources',
        explanation:
          'This ordering is inverted at the top: resource groups are near the bottom of the hierarchy, and resources are always the lowest level.',
      },
    ],
    correct: ['a'],
  },

  // ── Describe Azure compute and networking services (9) ───────────────────
  {
    id: 'arch-009',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'A developer needs to run a small piece of code that resizes an image every time a file lands in a storage account. The developer wants to manage no servers and pay only while the code executes. Which compute service is the best fit?',
    options: [
      {
        id: 'a',
        text: 'Azure Virtual Machines',
        explanation:
          'A virtual machine bills while it runs regardless of activity, and the developer would have to manage the operating system, which contradicts both requirements.',
      },
      {
        id: 'b',
        text: 'Azure Container Instances',
        explanation:
          'Container Instances run containers without managing servers, but the developer would still need to build and maintain a container image and wire up event handling; there is no built-in trigger for storage events.',
      },
      {
        id: 'c',
        text: 'Azure Functions',
        explanation:
          'Functions is serverless, event-driven compute with a built-in trigger for blob uploads, and the consumption plan bills only for the time the code actually runs.',
      },
      {
        id: 'd',
        text: 'Azure Virtual Desktop',
        explanation:
          'Azure Virtual Desktop delivers virtualized Windows desktops to users; it is not a service for running event-driven application code.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/azure-functions/functions-overview',
  },
  {
    id: 'arch-010',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'Which statement describes an advantage of containers compared to virtual machines?',
    options: [
      {
        id: 'a',
        text: 'Containers each include a full guest operating system, which strengthens isolation.',
        explanation:
          'It is virtual machines that carry a full guest operating system; containers deliberately omit one, which is why they are lighter but offer somewhat weaker isolation.',
      },
      {
        id: 'b',
        text: 'Containers virtualize the operating system rather than the hardware, so they start faster and consume fewer resources than virtual machines.',
        explanation:
          'Because containers share the host operating system kernel instead of booting their own, they start in seconds and pack more densely onto the same infrastructure.',
      },
      {
        id: 'c',
        text: 'Containers remove the need for any operating system on the host.',
        explanation:
          'Containers still depend on a host operating system whose kernel they share; they remove the per-instance guest OS, not the host OS.',
      },
      {
        id: 'd',
        text: 'Containers are automatically replicated across Azure regions.',
        explanation:
          'Cross-region replication is not an inherent property of containers; distributing workloads across regions requires an explicit deployment or orchestration decision.',
      },
    ],
    correct: ['b'],
  },
  {
    id: 'arch-011',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'A retail website runs on Azure virtual machines and sees large traffic swings during sales events. The team wants a set of identical, load-balanced VMs whose instance count increases and decreases automatically with demand. Which service should the team use?',
    options: [
      {
        id: 'a',
        text: 'Availability sets',
        explanation:
          'Availability sets improve resilience to hardware failures and maintenance, but they never change the number of VMs in response to load.',
      },
      {
        id: 'b',
        text: 'Azure Virtual Desktop',
        explanation:
          'Azure Virtual Desktop provides cloud-hosted desktops for users; it is not a mechanism for scaling a web workload.',
      },
      {
        id: 'c',
        text: 'Azure Kubernetes Service',
        explanation:
          'AKS orchestrates containerized applications; it is not the natural choice for scaling an existing VM-based website that is not containerized.',
      },
      {
        id: 'd',
        text: 'Azure Virtual Machine Scale Sets',
        explanation:
          'Scale sets create and manage a group of identical VMs behind a load balancer and can automatically add or remove instances based on demand or a schedule.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/virtual-machine-scale-sets/overview',
  },
  {
    id: 'arch-012',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'What is the purpose of placing Azure virtual machines in an availability set?',
    options: [
      {
        id: 'a',
        text: 'To spread the VMs across fault domains and update domains so a single hardware failure or maintenance event does not take all of them offline',
        explanation:
          'Fault domains separate the VMs onto different racks with independent power and networking, and update domains ensure planned maintenance reboots only a subset at a time.',
      },
      {
        id: 'b',
        text: 'To replicate the VMs to the paired Azure region for disaster recovery',
        explanation:
          'Availability sets operate within a single datacenter; cross-region protection requires a separate approach such as Azure Site Recovery or a second deployment.',
      },
      {
        id: 'c',
        text: 'To add VM instances automatically when processor load increases',
        explanation:
          'Automatic scaling of instance counts is a feature of Azure Virtual Machine Scale Sets, not of availability sets.',
      },
      {
        id: 'd',
        text: 'To distribute the VMs across physically separate datacenters within the region',
        explanation:
          'Spreading VMs across separate datacenter locations in a region is what availability zones do; an availability set works inside a single datacenter.',
      },
    ],
    correct: ['a'],
  },
  {
    id: 'arch-013',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'A company with many remote employees wants each of them to sign in from a personal device and receive a full Windows desktop experience hosted in Azure, including support for multi-session Windows 11. Which service provides this?',
    options: [
      {
        id: 'a',
        text: 'Azure Virtual Machine Scale Sets',
        explanation:
          'Scale sets manage groups of identical VMs for application workloads; they do not deliver a managed end-user desktop experience.',
      },
      {
        id: 'b',
        text: 'Azure Virtual Desktop',
        explanation:
          'Azure Virtual Desktop is the desktop and application virtualization service in Azure, and it is the only offering that supports multi-session Windows 11 for many users on one VM.',
      },
      {
        id: 'c',
        text: 'Azure App Service',
        explanation:
          'App Service hosts web applications and APIs; it cannot present users with a Windows desktop environment.',
      },
      {
        id: 'd',
        text: 'Azure Bastion',
        explanation:
          'Bastion provides secure browser-based RDP and SSH connectivity to VMs for administration; it is a connectivity service, not a managed desktop virtualization platform.',
      },
    ],
    correct: ['b'],
  },
  {
    id: 'arch-014',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'multi',
    stem: 'An administrator plans to create a single Azure virtual machine. Which three resources are required by or created along with the VM? Select three.',
    options: [
      {
        id: 'a',
        text: 'A network interface',
        explanation:
          'Every VM needs at least one network interface to connect it to a subnet and give it an IP address; one is created automatically if not supplied.',
      },
      {
        id: 'b',
        text: 'An operating system disk',
        explanation:
          'A VM cannot boot without an OS disk, which Azure provisions as a managed disk when the VM is created.',
      },
      {
        id: 'c',
        text: 'A virtual network',
        explanation:
          'The network interface of a VM must attach to a subnet, and subnets only exist inside a virtual network, so a VNet must exist or be created with the VM.',
      },
      {
        id: 'd',
        text: 'An Azure Load Balancer',
        explanation:
          'A load balancer distributes traffic across multiple instances; a single VM is fully functional without one.',
      },
      {
        id: 'e',
        text: 'An ExpressRoute circuit',
        explanation:
          'ExpressRoute provides private connectivity to on-premises networks and is entirely optional; most VMs are created without one.',
      },
    ],
    correct: ['a', 'b', 'c'],
  },
  {
    id: 'arch-015',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'A development team wants to host an HTTP-based web application with server-side code but does not want to manage operating systems or web server software. Which Azure service should the team choose?',
    options: [
      {
        id: 'a',
        text: 'Azure Virtual Machines',
        explanation:
          'Hosting on VMs would give full control but also full responsibility for patching the OS and maintaining the web server, which the team wants to avoid.',
      },
      {
        id: 'b',
        text: 'Azure DNS',
        explanation:
          'Azure DNS hosts DNS zones and answers name-resolution queries; it cannot run application code.',
      },
      {
        id: 'c',
        text: 'Azure App Service',
        explanation:
          'App Service is a platform-as-a-service host for web apps and APIs: Azure manages the OS and web server while the team deploys only its code.',
      },
      {
        id: 'd',
        text: 'Azure Blob Storage static website hosting',
        explanation:
          'Static website hosting serves only files such as HTML, CSS, and JavaScript; it cannot execute the server-side code this application requires.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/app-service/overview',
  },
  {
    id: 'arch-016',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'multi',
    stem: 'A company needs to connect its on-premises network to an Azure virtual network. Which two Azure services can provide this connectivity? Select two.',
    options: [
      {
        id: 'a',
        text: 'Azure VPN Gateway',
        explanation:
          'VPN Gateway creates encrypted site-to-site tunnels between on-premises VPN devices and an Azure virtual network over the public internet.',
      },
      {
        id: 'b',
        text: 'Azure DNS',
        explanation:
          'Azure DNS resolves domain names to IP addresses; it plays no role in carrying network traffic between locations.',
      },
      {
        id: 'c',
        text: 'Azure ExpressRoute',
        explanation:
          'ExpressRoute establishes a private, dedicated connection between on-premises infrastructure and Azure through a connectivity provider, without traversing the public internet.',
      },
      {
        id: 'd',
        text: 'Virtual network peering',
        explanation:
          'Peering links two Azure virtual networks to each other; it cannot reach a network that lives outside Azure.',
      },
    ],
    correct: ['a', 'c'],
  },
  {
    id: 'arch-017',
    domain: 'architecture-services',
    topic: 'compute-networking',
    kind: 'single',
    stem: 'A company wants virtual machines in its Azure virtual network to reach an Azure storage account through a private IP address so the traffic never crosses the public internet. What should the company configure?',
    options: [
      {
        id: 'a',
        text: 'A public endpoint on the storage account',
        explanation:
          'A public endpoint is the default internet-facing entry point for the service; it is exactly what the company is trying to avoid using.',
      },
      {
        id: 'b',
        text: 'A private endpoint for the storage account',
        explanation:
          'A private endpoint is a network interface that receives a private IP address from a subnet of the virtual network and connects it to the storage account over Azure Private Link, keeping traffic on the Microsoft network.',
      },
      {
        id: 'c',
        text: 'Virtual network peering to the storage account',
        explanation:
          'Peering connects two virtual networks together; a storage account is a platform service, not a virtual network, so it cannot be peered.',
      },
      {
        id: 'd',
        text: 'An Azure VPN Gateway in the virtual network',
        explanation:
          'A VPN gateway connects the virtual network to other networks over encrypted tunnels; it does not assign a private address to a platform service such as storage.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/azure/private-link/private-endpoint-overview',
  },

  // ── Describe Azure storage services (8) ──────────────────────────────────
  {
    id: 'arch-018',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A company needs a fully managed file share that several Windows virtual machines can mount at the same time by using the SMB protocol. Which Azure Storage service should it use?',
    options: [
      {
        id: 'a',
        text: 'Azure Blob Storage',
        explanation:
          'Blob Storage is object storage accessed over HTTP-based APIs; it cannot be mounted as a standard SMB file share by Windows VMs.',
      },
      {
        id: 'b',
        text: 'Azure Queue Storage',
        explanation:
          'Queue Storage stores messages so application components can communicate asynchronously; it is not a file service at all.',
      },
      {
        id: 'c',
        text: 'Azure Files',
        explanation:
          'Azure Files provides fully managed file shares that support SMB (and NFS), so multiple VMs can mount the same share exactly like a traditional file server share.',
      },
      {
        id: 'd',
        text: 'Azure Table Storage',
        explanation:
          'Table Storage is a NoSQL store for structured key-attribute data; it has no concept of files or shares.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/storage/files/storage-files-introduction',
  },
  {
    id: 'arch-019',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A hospital must retain medical imaging blobs for seven years to satisfy regulations. The data will almost never be read, a retrieval delay of several hours is acceptable, and storage cost must be as low as possible. Which access tier should the hospital choose?',
    options: [
      {
        id: 'a',
        text: 'Hot',
        explanation:
          'The hot tier is optimized for frequently accessed data and carries the highest storage cost, the opposite of what long-term rarely read retention needs.',
      },
      {
        id: 'b',
        text: 'Cool',
        explanation:
          'The cool tier suits infrequently accessed data kept at least 30 days, but it remains an online tier priced well above the cheapest option available here.',
      },
      {
        id: 'c',
        text: 'Cold',
        explanation:
          'The cold tier is cheaper than cool for rarely accessed data, but it is still an online tier with millisecond access; since hours-long retrieval is acceptable, an even cheaper tier exists.',
      },
      {
        id: 'd',
        text: 'Archive',
        explanation:
          'Archive is the lowest-cost tier and stores data offline; blobs must be rehydrated before reading, which can take hours, matching the stated tolerance exactly.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/storage/blobs/access-tiers-overview',
  },
  {
    id: 'arch-020',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A financial services firm requires that its storage account data remain available even if one datacenter in the region fails, but regulations require all copies of the data to stay within that single region. Which redundancy option should the firm select?',
    options: [
      {
        id: 'a',
        text: 'Geo-redundant storage (GRS)',
        explanation:
          'GRS copies data asynchronously to a secondary region, which violates the requirement to keep every copy inside one region.',
      },
      {
        id: 'b',
        text: 'Locally redundant storage (LRS)',
        explanation:
          'LRS keeps three copies within a single datacenter, so a failure of that datacenter could make the data unavailable.',
      },
      {
        id: 'c',
        text: 'Zone-redundant storage (ZRS)',
        explanation:
          'ZRS synchronously replicates data across three availability zones in the region, surviving a datacenter failure while never leaving the region.',
      },
      {
        id: 'd',
        text: 'Read-access geo-redundant storage (RA-GRS)',
        explanation:
          'RA-GRS adds readable access to a secondary-region copy, so like GRS it stores data outside the primary region and fails the residency requirement.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/storage/common/storage-redundancy',
  },
  {
    id: 'arch-021',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'multi',
    stem: 'Which three Azure Storage redundancy options replicate data to a secondary region? Select three.',
    options: [
      {
        id: 'a',
        text: 'Locally redundant storage (LRS)',
        explanation:
          'LRS keeps all three copies inside one datacenter in the primary region; nothing is sent to a second region.',
      },
      {
        id: 'b',
        text: 'Geo-redundant storage (GRS)',
        explanation:
          'GRS combines LRS in the primary region with asynchronous replication of the data to the paired secondary region.',
      },
      {
        id: 'c',
        text: 'Zone-redundant storage (ZRS)',
        explanation:
          'ZRS spreads copies across availability zones, but all of those zones are inside the primary region.',
      },
      {
        id: 'd',
        text: 'Geo-zone-redundant storage (GZRS)',
        explanation:
          'GZRS combines zone redundancy in the primary region with asynchronous replication to the secondary region, protecting against both zone and regional failures.',
      },
      {
        id: 'e',
        text: 'Read-access geo-redundant storage (RA-GRS)',
        explanation:
          'RA-GRS replicates to the secondary region just like GRS and additionally allows the secondary copy to be read at any time.',
      },
    ],
    correct: ['b', 'd', 'e'],
    learnMore: 'https://learn.microsoft.com/azure/storage/common/storage-redundancy',
  },
  {
    id: 'arch-022',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A solutions architect needs one storage account that can hold blobs, file shares, queues, and tables and is the type Microsoft recommends for most scenarios. Which storage account type should the architect create?',
    options: [
      {
        id: 'a',
        text: 'Standard general-purpose v2',
        explanation:
          'General-purpose v2 is the recommended default account type and is the one that supports all four services — Blob, Files, Queue, and Table — in a single account.',
      },
      {
        id: 'b',
        text: 'Premium block blobs',
        explanation:
          'Premium block blob accounts run on SSDs for high transaction rates but store only block and append blobs, so files, queues, and tables are unavailable.',
      },
      {
        id: 'c',
        text: 'Premium file shares',
        explanation:
          'Premium file share accounts are dedicated to Azure Files workloads and cannot hold blobs, queues, or tables.',
      },
      {
        id: 'd',
        text: 'Premium page blobs',
        explanation:
          'Premium page blob accounts store only page blobs, such as unmanaged disk data, and support none of the other storage services.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/azure/storage/common/storage-account-overview',
  },
  {
    id: 'arch-023',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'An engineer must upload millions of blobs to a storage account every night as part of an automated, scripted job. Which tool is designed for this task?',
    options: [
      {
        id: 'a',
        text: 'Azure Storage Explorer',
        explanation:
          'Storage Explorer is a graphical desktop application for browsing and managing storage interactively; it is not intended to be driven by an unattended nightly script.',
      },
      {
        id: 'b',
        text: 'AzCopy',
        explanation:
          'AzCopy is a command-line utility optimized for high-performance bulk copies to and from Azure Storage, making it ideal for scheduled, scripted transfers.',
      },
      {
        id: 'c',
        text: 'Azure File Sync',
        explanation:
          'Azure File Sync keeps Azure file shares synchronized with Windows Server file servers; it is a sync service for file shares, not a blob upload tool.',
      },
      {
        id: 'd',
        text: 'Azure Data Box',
        explanation:
          'Data Box is a physical appliance shipped to your site for one-time offline transfers; it makes no sense for a recurring nightly online job.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/azure/storage/common/storage-use-azcopy-v10',
  },
  {
    id: 'arch-024',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A branch office wants employees to open frequently used files quickly from a local Windows Server, while the complete file share lives in Azure Files and rarely used files are tiered to the cloud. Which service enables this setup?',
    options: [
      {
        id: 'a',
        text: 'AzCopy',
        explanation:
          'AzCopy performs one-off or scheduled copies; it cannot keep a server continuously synchronized with a cloud share or tier cold files to the cloud.',
      },
      {
        id: 'b',
        text: 'Azure Backup',
        explanation:
          'Azure Backup protects data so it can be restored after loss; it does not present a synchronized local cache of a cloud file share.',
      },
      {
        id: 'c',
        text: 'Azure Data Box',
        explanation:
          'Data Box handles bulk one-time data transfers by shipping a physical device; it provides no ongoing synchronization between a server and Azure Files.',
      },
      {
        id: 'd',
        text: 'Azure File Sync',
        explanation:
          'Azure File Sync turns a Windows Server into a local cache of an Azure file share, and its cloud tiering feature keeps hot files local while cold files live only in Azure.',
      },
    ],
    correct: ['d'],
  },
  {
    id: 'arch-025',
    domain: 'architecture-services',
    topic: 'storage',
    kind: 'single',
    stem: 'A media company must move 400 TB of video archives from its on-premises datacenter into Azure Storage. Its internet connection is slow, and the transfer must not depend on that link. Which option should the company use?',
    options: [
      {
        id: 'a',
        text: 'Azure Migrate',
        explanation:
          'Azure Migrate is a hub for discovering, assessing, and migrating servers, databases, and applications; it is not itself an offline bulk-data transfer mechanism.',
      },
      {
        id: 'b',
        text: 'AzCopy',
        explanation:
          'AzCopy transfers data over the network, so a 400 TB copy would be limited by the same slow internet link the company wants to avoid.',
      },
      {
        id: 'c',
        text: 'Azure Data Box',
        explanation:
          'Data Box is a rugged storage appliance that Microsoft ships to the customer; the company loads its data locally and ships the device back for import, bypassing the network entirely.',
      },
      {
        id: 'd',
        text: 'Azure File Sync',
        explanation:
          'File Sync synchronizes Windows Server file shares with Azure Files over the network, so it neither avoids the slow link nor targets blob archives.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/databox/data-box-overview',
  },

  // ── Describe Azure identity, access, and security (9) ────────────────────
  {
    id: 'arch-026',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'A company moves a legacy application onto Azure virtual machines. The application requires domain join, LDAP, and Kerberos authentication, but the team refuses to deploy and maintain domain controllers. Which service should the team use?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Entra ID',
        explanation:
          'Microsoft Entra ID is a cloud identity service built around modern protocols such as OAuth and SAML; on its own it does not provide domain join, LDAP, or the legacy Kerberos/NTLM support this application needs.',
      },
      {
        id: 'b',
        text: 'Microsoft Entra Domain Services',
        explanation:
          'Entra Domain Services provides a managed domain with domain join, group policy, LDAP, and Kerberos/NTLM authentication, and Microsoft operates the domain controllers for you.',
      },
      {
        id: 'c',
        text: 'Microsoft Entra External ID',
        explanation:
          'External ID manages identities for partners and customers accessing your applications; it has nothing to do with legacy domain protocols for servers.',
      },
      {
        id: 'd',
        text: 'Windows Server Active Directory installed on Azure virtual machines',
        explanation:
          'Running your own domain controllers on VMs would satisfy the protocols, but the team would have to deploy, patch, and manage them, which is exactly what it wants to avoid.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/entra/identity/domain-services/overview',
  },
  {
    id: 'arch-027',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'During sign-in, a user first enters a password and is then required to approve a notification in the Microsoft Authenticator app on a registered phone. Which authentication approach does this sign-in demonstrate?',
    options: [
      {
        id: 'a',
        text: 'Single sign-on (SSO)',
        explanation:
          'SSO means one authentication grants access to multiple applications; it says nothing about how many forms of evidence the sign-in itself requires.',
      },
      {
        id: 'b',
        text: 'Passwordless authentication',
        explanation:
          'A password was entered as the first step, so by definition this sign-in is not passwordless.',
      },
      {
        id: 'c',
        text: 'Microsoft Entra Conditional Access',
        explanation:
          'Conditional Access is the policy engine that can demand stronger authentication under certain conditions; it is not itself the authentication method being performed.',
      },
      {
        id: 'd',
        text: 'Multifactor authentication (MFA)',
        explanation:
          'The sign-in combines something the user knows (the password) with something the user has (the registered phone), which is the definition of multifactor authentication.',
      },
    ],
    correct: ['d'],
  },
  {
    id: 'arch-028',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'multi',
    stem: 'A security team wants to remove passwords from daily sign-in for its workforce. Which three Microsoft Entra authentication methods are passwordless? Select three.',
    options: [
      {
        id: 'a',
        text: 'Windows Hello for Business',
        explanation:
          'Windows Hello for Business replaces the password with biometrics or a PIN that is cryptographically bound to the specific device, so no password is transmitted or entered.',
      },
      {
        id: 'b',
        text: 'A password combined with an SMS one-time code',
        explanation:
          'Adding an SMS code to a password is multifactor authentication, but the password remains part of the sign-in, so it is not passwordless.',
      },
      {
        id: 'c',
        text: 'FIDO2 security keys',
        explanation:
          'FIDO2 keys are hardware devices that perform standards-based cryptographic sign-in with no password involved.',
      },
      {
        id: 'd',
        text: 'Microsoft Authenticator app phone sign-in',
        explanation:
          'Phone sign-in with the Authenticator app replaces the password with an approval plus device biometric or PIN, making the whole flow passwordless.',
      },
      {
        id: 'e',
        text: 'Security questions',
        explanation:
          'Security questions are knowledge-based answers used in flows such as self-service password reset; they are not a passwordless sign-in method.',
      },
    ],
    correct: ['a', 'c', 'd'],
  },
  {
    id: 'arch-029',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'A manufacturer wants engineers at a partner organization to access its Azure-hosted applications by signing in with credentials issued and managed by the partner organization. Which capability should the manufacturer use?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Entra B2B collaboration',
        explanation:
          'B2B collaboration invites external users as guests who keep authenticating with their own home-organization credentials, so the manufacturer never manages their passwords.',
      },
      {
        id: 'b',
        text: 'Microsoft Entra Domain Services',
        explanation:
          'Entra Domain Services provides a managed legacy domain for servers and applications; it does not handle inviting external users into a tenant.',
      },
      {
        id: 'c',
        text: 'Microsoft Entra ID Protection',
        explanation:
          'ID Protection detects and responds to risky sign-ins and compromised identities; it does not grant partner users access to applications.',
      },
      {
        id: 'd',
        text: 'Self-service password reset',
        explanation:
          'Self-service password reset lets existing users recover their own accounts; it is unrelated to giving external partners access.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/entra/external-id/external-identities-overview',
  },
  {
    id: 'arch-030',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'A security team wants sign-ins that originate outside the corporate network to require additional identity verification, while sign-ins from office locations proceed normally. Which Microsoft Entra feature evaluates signals like these and enforces such a policy?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Entra Conditional Access',
        explanation:
          'Conditional Access applies if-then policies to sign-in signals such as location, device state, and risk, so it can require MFA only for sign-ins coming from outside trusted locations.',
      },
      {
        id: 'b',
        text: 'Security defaults',
        explanation:
          'Security defaults apply one fixed baseline of protections to the whole tenant and cannot make exceptions based on location or other signals.',
      },
      {
        id: 'c',
        text: 'Azure role-based access control (RBAC)',
        explanation:
          'RBAC decides what an already-authenticated user may do with Azure resources; it plays no part in how the sign-in itself is verified.',
      },
      {
        id: 'd',
        text: 'Single sign-on (SSO)',
        explanation:
          'SSO reduces how often users must authenticate across applications; it does not add location-aware verification requirements.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/entra/identity/conditional-access/overview',
  },
  {
    id: 'arch-031',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'multi',
    stem: 'Which two statements about Azure role-based access control (RBAC) are true? Select two.',
    options: [
      {
        id: 'a',
        text: 'A role assigned at subscription scope is inherited by every resource group and resource within that subscription.',
        explanation:
          'RBAC scopes form a hierarchy, and assignments flow down from parent to child scopes, so a subscription-level assignment applies to everything beneath it.',
      },
      {
        id: 'b',
        text: 'Azure RBAC is used to enforce password expiration rules for users.',
        explanation:
          'Password and credential policies are handled by Microsoft Entra ID; RBAC only controls what actions identities can perform on Azure resources.',
      },
      {
        id: 'c',
        text: 'A role assignment consists of a security principal, a role definition, and a scope.',
        explanation:
          'These are the three elements of every assignment: who (user, group, service principal, or managed identity), what they can do, and where the permissions apply.',
      },
      {
        id: 'd',
        text: 'The built-in Reader role allows users to modify the resources they can see.',
        explanation:
          'Reader grants view-only access; making changes requires a role with write permissions such as Contributor.',
      },
    ],
    correct: ['a', 'c'],
    learnMore: 'https://learn.microsoft.com/azure/role-based-access-control/overview',
  },
  {
    id: 'arch-032',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'A company decides to stop treating its corporate network as a trusted boundary: every access request must be fully authenticated and authorized as though it came from an open network, users receive only the minimum permissions they need, and the company operates as if a breach has already happened. Which security model is the company adopting?',
    options: [
      {
        id: 'a',
        text: 'Defense in depth',
        explanation:
          'Defense in depth is about stacking multiple protective layers; it complements this model but is not defined by the verify-explicitly and assume-breach principles described.',
      },
      {
        id: 'b',
        text: 'Perimeter security',
        explanation:
          'Perimeter security is the older approach being abandoned here: it trusts everything inside the network boundary, which is exactly what the company is moving away from.',
      },
      {
        id: 'c',
        text: 'Zero Trust',
        explanation:
          'Verify explicitly, use least-privilege access, and assume breach are the three guiding principles of the Zero Trust model.',
      },
      {
        id: 'd',
        text: 'The shared responsibility model',
        explanation:
          'Shared responsibility describes how security duties divide between the cloud provider and the customer; it is not a model for evaluating individual access requests.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/security/zero-trust/zero-trust-overview',
  },
  {
    id: 'arch-033',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'Which statement describes the purpose of the defense-in-depth model?',
    options: [
      {
        id: 'a',
        text: 'To concentrate all security enforcement at the network perimeter',
        explanation:
          'Relying on the perimeter alone is the single point of failure that defense in depth is designed to eliminate.',
      },
      {
        id: 'b',
        text: 'To transfer responsibility for security entirely to the cloud provider',
        explanation:
          'Under the shared responsibility model the customer always keeps some security duties, and defense in depth is a strategy for fulfilling them, not for handing them off.',
      },
      {
        id: 'c',
        text: 'To require multifactor authentication for every user in the organization',
        explanation:
          'MFA is one control at the identity layer; defense in depth is a broader strategy that spans many layers, not a single control.',
      },
      {
        id: 'd',
        text: 'To layer protections across physical security, identity, perimeter, network, compute, application, and data so no single failed control exposes the system',
        explanation:
          'Layering independent controls means an attacker who defeats one layer is slowed and detected by the next, protecting the data at the center even when a single mechanism fails.',
      },
    ],
    correct: ['d'],
  },
  {
    id: 'arch-034',
    domain: 'architecture-services',
    topic: 'identity-access-security',
    kind: 'single',
    stem: 'An organization wants continuous assessment of the security posture of its Azure resources, a secure score with hardening recommendations, and threat protection for its workloads. Which service provides these capabilities?',
    options: [
      {
        id: 'a',
        text: 'Microsoft Sentinel',
        explanation:
          'Sentinel is a SIEM and SOAR service that collects and correlates security events for investigation and automated response; it does not produce posture recommendations or a secure score.',
      },
      {
        id: 'b',
        text: 'Azure Firewall',
        explanation:
          'Azure Firewall filters network traffic to and from virtual networks; it protects one layer rather than assessing the security posture of all resources.',
      },
      {
        id: 'c',
        text: 'Azure Key Vault',
        explanation:
          'Key Vault safeguards secrets, keys, and certificates; it does not evaluate resource configurations or detect threats across workloads.',
      },
      {
        id: 'd',
        text: 'Microsoft Defender for Cloud',
        explanation:
          'Defender for Cloud combines cloud security posture management — including secure score and hardening recommendations — with workload protection that detects and alerts on threats.',
      },
    ],
    correct: ['d'],
    learnMore:
      'https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction',
  },
]
