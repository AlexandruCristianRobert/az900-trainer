import type { Question } from '../types'

export const cloudConceptsQuestions: Question[] = [
  // ---------------------------------------------------------------------------
  // Topic: describe-cloud-computing (9 questions, cc-001 – cc-009)
  // ---------------------------------------------------------------------------
  {
    id: 'cc-001',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'Which statement best defines cloud computing?',
    options: [
      {
        id: 'a',
        text: 'The practice of hosting all of a company’s workloads in a datacenter that the company owns and operates.',
        explanation:
          'This describes a traditional on-premises environment. Cloud computing specifically moves the ownership and operation of the infrastructure to a provider.',
      },
      {
        id: 'b',
        text: 'The delivery of computing services, such as virtual machines, storage, databases, and networking, over the internet.',
        explanation:
          'Cloud computing means renting IT capabilities from a provider and consuming them over the internet, rather than owning and running the underlying hardware yourself.',
      },
      {
        id: 'c',
        text: 'The process of virtualizing physical servers inside an on-premises environment.',
        explanation:
          'Virtualization is an enabling technology that cloud providers use heavily, but on its own it does not involve consuming services from a provider over the internet.',
      },
      {
        id: 'd',
        text: 'A software licensing model that lets a company install purchased applications on an unlimited number of devices.',
        explanation:
          'This describes a licensing arrangement, not a way of delivering computing services. Cloud computing is about consuming services on demand, not about installation rights.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
  },
  {
    id: 'cc-002',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'multi',
    stem: 'Under the shared responsibility model, which responsibilities always remain with the customer, regardless of whether a workload uses IaaS, PaaS, or SaaS? Select three.',
    options: [
      {
        id: 'a',
        text: 'The information and data stored in the cloud service.',
        explanation:
          'Customers always own their data and remain accountable for classifying and protecting it. The provider never assumes this responsibility, even in SaaS.',
      },
      {
        id: 'b',
        text: 'Maintaining the physical hosts that run the service.',
        explanation:
          'Physical hosts sit in the provider’s datacenters, so their maintenance always belongs to the cloud provider in every service model.',
      },
      {
        id: 'c',
        text: 'The devices, such as laptops and phones, used to access the service.',
        explanation:
          'Endpoint devices sit on the customer’s side of the connection, so securing and managing them is always the customer’s job in every service model.',
      },
      {
        id: 'd',
        text: 'Patching the physical network equipment inside the provider’s datacenters.',
        explanation:
          'The physical network is part of the provider-owned infrastructure, so the provider is responsible for it in every service model.',
      },
      {
        id: 'e',
        text: 'The accounts and identities used to sign in to the service.',
        explanation:
          'Customers create and control their user accounts and identities, so protecting them (for example, with strong authentication) always stays with the customer.',
      },
    ],
    correct: ['a', 'c', 'e'],
    learnMore: 'https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility',
  },
  {
    id: 'cc-003',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'A company hosts a line-of-business application on Azure virtual machines by using infrastructure as a service (IaaS). Under the shared responsibility model, who is responsible for applying operating system updates to those virtual machines?',
    options: [
      {
        id: 'a',
        text: 'Microsoft, because it owns the physical servers the virtual machines run on.',
        explanation:
          'Owning the physical hosts makes Microsoft responsible for the hardware layer only. In IaaS, responsibility for the guest operating system moves to the customer.',
      },
      {
        id: 'b',
        text: 'Responsibility is split equally between Microsoft and the company for each update.',
        explanation:
          'The shared responsibility model assigns whole layers to one party rather than splitting individual tasks. In IaaS, the guest operating system layer belongs to the customer.',
      },
      {
        id: 'c',
        text: 'The company, because customers manage the operating system in an IaaS deployment.',
        explanation:
          'In IaaS the provider delivers the virtualized hardware, while everything from the operating system upward, including patching, is the customer’s responsibility.',
      },
      {
        id: 'd',
        text: 'Microsoft, because Azure automatically patches the guest operating system of every virtual machine by default.',
        explanation:
          'Azure offers optional update-management features that customers can enable, but they do not change the model: accountability for the guest operating system in IaaS stays with the customer.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility',
  },
  {
    id: 'cc-004',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'Which cloud model delivers computing resources that are dedicated to a single organization, whether the hardware runs in that organization’s own datacenter or is hosted for it by a third party?',
    options: [
      {
        id: 'a',
        text: 'Private cloud',
        explanation:
          'A private cloud serves one organization exclusively, giving it greater control at the cost of greater responsibility, and it can be hosted on-premises or by a third party.',
      },
      {
        id: 'b',
        text: 'Public cloud',
        explanation:
          'A public cloud is built and operated by a provider and made available over the internet to any customer, so its infrastructure is shared rather than dedicated to one organization.',
      },
      {
        id: 'c',
        text: 'Hybrid cloud',
        explanation:
          'A hybrid cloud interconnects a public and a private environment; the question describes only the dedicated, single-organization environment.',
      },
      {
        id: 'd',
        text: 'Multi-cloud',
        explanation:
          'Multi-cloud means using services from more than one public cloud provider at the same time, which is unrelated to having resources dedicated to a single organization.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
  },
  {
    id: 'cc-005',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'A regional bank must keep customer records on servers in its own datacenter to satisfy regulators, but it also wants to run its public-facing website on Azure and connect the two environments. Which cloud model should the bank adopt?',
    options: [
      {
        id: 'a',
        text: 'Public cloud',
        explanation:
          'A purely public deployment would move everything to provider-operated infrastructure, which conflicts with the requirement to keep customer records in the bank’s own datacenter.',
      },
      {
        id: 'b',
        text: 'Private cloud',
        explanation:
          'A purely private deployment would satisfy the data-residency requirement but would give up the Azure-hosted website the bank also wants.',
      },
      {
        id: 'c',
        text: 'Community cloud',
        explanation:
          'A community cloud is shared by organizations with common concerns, such as an industry consortium. It does not describe connecting one organization’s datacenter to a public cloud.',
      },
      {
        id: 'd',
        text: 'Hybrid cloud',
        explanation:
          'A hybrid cloud interconnects a private environment with a public cloud, letting the bank keep regulated data on-premises while running its website on Azure.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
  },
  {
    id: 'cc-006',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'Which statement describes the consumption-based model in cloud computing?',
    options: [
      {
        id: 'a',
        text: 'Organizations pay a fixed monthly fee no matter how much they use the services.',
        explanation:
          'A flat fee decouples cost from usage, which is the opposite of the consumption-based model, where the bill rises and falls with actual usage.',
      },
      {
        id: 'b',
        text: 'Organizations pay only for the resources they actually use, with no upfront infrastructure purchase.',
        explanation:
          'The consumption-based model is an operational expenditure (OpEx) approach: there is no upfront capital cost, charges track real usage, and payments stop when usage stops.',
      },
      {
        id: 'c',
        text: 'Organizations buy hardware in advance and depreciate the cost over several years.',
        explanation:
          'Buying and depreciating hardware is capital expenditure (CapEx), which is how traditional on-premises infrastructure is funded, not how consumption-based cloud billing works.',
      },
      {
        id: 'd',
        text: 'Organizations must commit to a one-year or three-year term before they can use any services.',
        explanation:
          'Term commitments describe optional discount offers such as reservations. The consumption-based model requires no commitment at all; you can start and stop at any time.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
  },
  {
    id: 'cc-007',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'A company runs a virtual machine that must stay online 24 hours a day for at least the next three years. Compared with standard pay-as-you-go rates, which Azure pricing approach is designed to lower the cost of this steady, predictable workload?',
    options: [
      {
        id: 'a',
        text: 'Spot pricing',
        explanation:
          'Spot pricing offers deep discounts on spare capacity, but the platform can evict spot virtual machines at any time, which makes it unsuitable for a workload that must stay online continuously.',
      },
      {
        id: 'b',
        text: 'An Azure free account',
        explanation:
          'A free account provides limited quantities of services for evaluation and learning; it is not a pricing model for running a production workload around the clock for years.',
      },
      {
        id: 'c',
        text: 'Reserved instances (Azure Reservations)',
        explanation:
          'Reservations exchange a one-year or three-year commitment for a significant discount, which fits a workload that is known to run continuously for a long period.',
      },
      {
        id: 'd',
        text: 'Pay-as-you-go',
        explanation:
          'Pay-as-you-go offers maximum flexibility with no commitment, but that flexibility comes at the highest unit rate, so it is the baseline the company wants to beat, not the discount option.',
      },
    ],
    correct: ['c'],
  },
  {
    id: 'cc-008',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'single',
    stem: 'A development team wants to run small pieces of code that execute in response to events, without provisioning or managing any servers, and be billed only while the code actually runs. Which cloud computing approach meets these requirements?',
    options: [
      {
        id: 'a',
        text: 'Serverless computing',
        explanation:
          'Serverless offerings such as Azure Functions abstract the servers away entirely: the platform provisions, scales, and manages the infrastructure, and billing is based on executions rather than reserved capacity.',
      },
      {
        id: 'b',
        text: 'Infrastructure as a service (IaaS) virtual machines',
        explanation:
          'Virtual machines require the team to size, provision, and patch servers, and they accrue charges while allocated even when no code is running.',
      },
      {
        id: 'c',
        text: 'Azure Dedicated Host',
        explanation:
          'A dedicated host gives an organization an entire physical server for its virtual machines, which is the opposite of removing server management and paying per execution.',
      },
      {
        id: 'd',
        text: 'Virtual desktop infrastructure',
        explanation:
          'Virtual desktop infrastructure delivers remote desktop sessions to users; it does not run event-driven code and still involves managing session capacity.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/azure/azure-functions/functions-overview',
  },
  {
    id: 'cc-009',
    domain: 'cloud-concepts',
    topic: 'describe-cloud-computing',
    kind: 'multi',
    stem: 'Which characteristics apply to the public cloud model? Select two.',
    options: [
      {
        id: 'a',
        text: 'Services are delivered over the public internet and are available to anyone who wants to purchase them.',
        explanation:
          'General availability over the internet is the defining trait of the public cloud: the provider builds the infrastructure and any customer can consume it.',
      },
      {
        id: 'b',
        text: 'The organization must buy and maintain the physical hardware that runs its workloads.',
        explanation:
          'Owning and maintaining hardware describes a private cloud or a traditional on-premises datacenter; in the public cloud the provider owns the hardware.',
      },
      {
        id: 'c',
        text: 'No capital expenditure is required to scale up.',
        explanation:
          'Because the provider already owns the infrastructure, a public-cloud customer scales by paying operational costs for more usage instead of buying equipment upfront.',
      },
      {
        id: 'd',
        text: 'The organization keeps complete control over the physical infrastructure and its security.',
        explanation:
          'Complete control of the hardware is a characteristic of the private cloud; public-cloud customers deliberately trade that control away in exchange for lower cost and effort.',
      },
    ],
    correct: ['a', 'c'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
  },

  // ---------------------------------------------------------------------------
  // Topic: benefits-of-cloud-services (8 questions, cc-010 – cc-017)
  // ---------------------------------------------------------------------------
  {
    id: 'cc-010',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'An online retailer wants its shopping site to keep running even when individual components fail, and it wants a formal uptime guarantee from its cloud provider. Which cloud benefit addresses this requirement?',
    options: [
      {
        id: 'a',
        text: 'Elasticity',
        explanation:
          'Elasticity is about automatically adjusting resources as demand changes; it does not by itself guarantee that the service stays reachable when components fail.',
      },
      {
        id: 'b',
        text: 'Predictability',
        explanation:
          'Predictability concerns forecasting costs and performance with confidence, not maximizing uptime in the face of component failures.',
      },
      {
        id: 'c',
        text: 'Agility',
        explanation:
          'Agility describes how quickly resources can be deployed and reconfigured as needs change; it says nothing about surviving failures or uptime guarantees.',
      },
      {
        id: 'd',
        text: 'High availability',
        explanation:
          'High availability focuses on ensuring maximum uptime despite failures, and cloud providers formalize it through service-level agreements (SLAs) that state an uptime commitment.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-011',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'During a seasonal sale, a company adds more virtual machine instances behind its load balancer to absorb extra traffic, then removes them when the sale ends. What is this scaling approach called?',
    options: [
      {
        id: 'a',
        text: 'Horizontal scaling',
        explanation:
          'Adding or removing instances of a resource is scaling out and in, which is exactly what horizontal scaling means.',
      },
      {
        id: 'b',
        text: 'Vertical scaling',
        explanation:
          'Vertical scaling changes the size of an existing instance, giving it more or less CPU and memory, rather than changing the number of instances.',
      },
      {
        id: 'c',
        text: 'High availability',
        explanation:
          'High availability is about keeping the service up when components fail; the scenario describes matching capacity to demand, not surviving failures.',
      },
      {
        id: 'd',
        text: 'Disaster recovery',
        explanation:
          'Disaster recovery restores services after a major outage or catastrophic event; it is not a technique for handling a temporary traffic increase.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-012',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'Which cloud benefit describes the ability of a system to recover from failures and continue to function?',
    options: [
      {
        id: 'a',
        text: 'Scalability',
        explanation:
          'Scalability is the ability to adjust resources to meet demand; it addresses capacity, not recovery from failures.',
      },
      {
        id: 'b',
        text: 'Governance',
        explanation:
          'Governance is about enforcing standards and compliance across deployed resources, not about how a system behaves when something breaks.',
      },
      {
        id: 'c',
        text: 'Reliability',
        explanation:
          'Reliability is defined as a system’s ability to recover from failures and keep functioning, and the cloud’s decentralized global infrastructure is designed to support it.',
      },
      {
        id: 'd',
        text: 'Interoperability',
        explanation:
          'Interoperability describes how well different systems and services work together, which is unrelated to recovering from failures.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-013',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'multi',
    stem: 'A finance director is evaluating how the cloud provides predictability. Which statements accurately describe predictability in the cloud? Select two.',
    options: [
      {
        id: 'a',
        text: 'Cloud providers guarantee that unit prices will never increase.',
        explanation:
          'Providers can and do adjust prices over time. Predictability comes from being able to forecast spend based on usage patterns, not from frozen price lists.',
      },
      {
        id: 'b',
        text: 'Autoscaling and load balancing help keep performance consistent as demand changes.',
        explanation:
          'This is performance predictability: the platform adds resources and distributes traffic automatically so users experience steady performance during demand spikes.',
      },
      {
        id: 'c',
        text: 'Workloads are pinned to specific physical servers so that results never vary.',
        explanation:
          'The cloud deliberately abstracts physical hardware away, and workloads can move between hosts; predictability does not come from fixed physical placement.',
      },
      {
        id: 'd',
        text: 'Real-time tracking of resource usage helps organizations forecast future costs with confidence.',
        explanation:
          'This is cost predictability: because usage is metered and visible as it happens, organizations can analyze patterns and predict what future bills will look like.',
      },
    ],
    correct: ['b', 'd'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-014',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'A media company is concerned about large distributed denial-of-service (DDoS) attacks that its small on-premises IT team could not absorb on its own. How does moving to the cloud help address this concern?',
    options: [
      {
        id: 'a',
        text: 'Workloads hosted in the cloud cannot be targeted by DDoS attacks.',
        explanation:
          'Cloud-hosted workloads are still exposed to the internet and can absolutely be targeted; the difference lies in the scale of the defenses, not in immunity.',
      },
      {
        id: 'b',
        text: 'Cloud providers operate network infrastructure at a scale that can absorb large attacks and offer built-in DDoS protection services.',
        explanation:
          'A major security benefit of the cloud is inheriting provider-scale network capacity and mitigation services that a small team could never build on-premises.',
      },
      {
        id: 'c',
        text: 'After migrating, the company no longer has any security responsibilities of its own.',
        explanation:
          'The shared responsibility model still applies after migration: the customer keeps responsibility for its data, identities, devices, and configuration choices.',
      },
      {
        id: 'd',
        text: 'Microsoft Entra ID automatically blocks all network-level attacks against cloud workloads.',
        explanation:
          'Microsoft Entra ID is an identity and access management service; defending against network-level flood attacks is the job of network protection services, not the identity platform.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-015',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'A multinational company must ensure that every resource its teams deploy in the cloud complies with corporate standards and government regulations, and it wants non-compliant resources flagged automatically. Which cloud benefit does this describe?',
    options: [
      {
        id: 'a',
        text: 'Elasticity',
        explanation:
          'Elasticity concerns automatically adjusting capacity to match demand; it has nothing to do with enforcing standards on deployed resources.',
      },
      {
        id: 'b',
        text: 'Consumption-based pricing',
        explanation:
          'Consumption-based pricing determines how usage is billed; it does not check resources against corporate or regulatory requirements.',
      },
      {
        id: 'c',
        text: 'Agility',
        explanation:
          'Agility is about reacting quickly to changing needs by provisioning resources fast, not about keeping those resources compliant with rules.',
      },
      {
        id: 'd',
        text: 'Governance',
        explanation:
          'Cloud governance uses policies and templates so that all deployed resources meet corporate standards and regulatory requirements, and it can flag or even remediate resources that drift out of compliance.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/azure/cloud-adoption-framework/',
  },
  {
    id: 'cc-016',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'An operations team administers its Azure resources through the Azure portal, the Azure CLI, PowerShell, and REST APIs. Which aspect of cloud manageability do these tools represent?',
    options: [
      {
        id: 'a',
        text: 'Management in the cloud',
        explanation:
          'Management in the cloud refers to the ways you interact with and administer your environment, such as a web portal, a command-line interface, APIs, and PowerShell.',
      },
      {
        id: 'b',
        text: 'Management of the cloud',
        explanation:
          'Management of the cloud covers capabilities such as automatic scaling, template-based deployment, and health monitoring with automatic replacement of failing resources, not the toolset used to administer them.',
      },
      {
        id: 'c',
        text: 'Governance',
        explanation:
          'Governance is about enforcing standards and compliance on resources; the scenario is about the administrative interfaces the team uses day to day.',
      },
      {
        id: 'd',
        text: 'Infrastructure as code',
        explanation:
          'Infrastructure as code is a specific practice of defining resources in declarative template files; the scenario lists interactive management tools rather than that practice.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },
  {
    id: 'cc-017',
    domain: 'cloud-concepts',
    topic: 'benefits-of-cloud-services',
    kind: 'single',
    stem: 'A database hosted on a single Azure virtual machine is running out of memory, so the administrator resizes the virtual machine to a larger size with more vCPUs and RAM. Which scaling concept does this illustrate?',
    options: [
      {
        id: 'a',
        text: 'Horizontal scaling',
        explanation:
          'Horizontal scaling changes the number of instances rather than their size; the administrator kept one instance and made it bigger.',
      },
      {
        id: 'b',
        text: 'Fault tolerance',
        explanation:
          'Fault tolerance is a system’s ability to keep operating when components fail; resizing for more memory addresses capacity, not failure handling.',
      },
      {
        id: 'c',
        text: 'Vertical scaling',
        explanation:
          'Increasing the CPU or memory of an existing instance is scaling up, which is the definition of vertical scaling.',
      },
      {
        id: 'd',
        text: 'Redundancy',
        explanation:
          'Redundancy means running duplicate components so one can take over if another fails; the scenario involves a single instance getting more resources.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-benefits-use-cloud-services/',
  },

  // ---------------------------------------------------------------------------
  // Topic: cloud-service-types (8 questions, cc-018 – cc-025)
  // ---------------------------------------------------------------------------
  {
    id: 'cc-018',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'Which cloud service type rents virtualized servers, storage, and networking to the customer, who then installs and manages the operating system and everything above it?',
    options: [
      {
        id: 'a',
        text: 'Software as a service (SaaS)',
        explanation:
          'In SaaS the provider runs a complete, ready-to-use application; the customer never touches servers or operating systems at all.',
      },
      {
        id: 'b',
        text: 'Platform as a service (PaaS)',
        explanation:
          'In PaaS the provider manages the operating system and runtime for the customer, so the customer does not install or maintain an operating system.',
      },
      {
        id: 'c',
        text: 'Function as a service (FaaS)',
        explanation:
          'Function as a service is a serverless approach where the customer supplies only code; the platform hides the servers and operating system entirely.',
      },
      {
        id: 'd',
        text: 'Infrastructure as a service (IaaS)',
        explanation:
          'IaaS delivers the virtualized building blocks (compute, storage, networking) and leaves the operating system and applications to the customer, offering the most control of the service types.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-019',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'In which cloud service type does the provider maintain the operating system, middleware, and development tools, while the customer focuses on building and deploying its own applications?',
    options: [
      {
        id: 'a',
        text: 'Infrastructure as a service (IaaS)',
        explanation:
          'IaaS stops at virtualized hardware: the customer, not the provider, installs and maintains the operating system and any development tooling.',
      },
      {
        id: 'b',
        text: 'Platform as a service (PaaS)',
        explanation:
          'PaaS is the middle ground: the provider keeps the operating system, middleware, and tooling patched and running, so development teams spend their time on application code.',
      },
      {
        id: 'c',
        text: 'Software as a service (SaaS)',
        explanation:
          'SaaS delivers a finished application to end users; customers configure and use it but do not build and deploy their own applications on it.',
      },
      {
        id: 'd',
        text: 'Desktop as a service (DaaS)',
        explanation:
          'Desktop as a service delivers hosted virtual desktops to users; it is not a platform aimed at building and deploying custom applications.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-020',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'Microsoft 365 provides email and office applications that users access over the internet on a subscription basis, while Microsoft operates all of the underlying infrastructure and application software. Which cloud service type does this exemplify?',
    options: [
      {
        id: 'a',
        text: 'Software as a service (SaaS)',
        explanation:
          'A complete, provider-operated application consumed on a subscription is the definition of SaaS; the customer simply uses the software and manages its own data and users.',
      },
      {
        id: 'b',
        text: 'Platform as a service (PaaS)',
        explanation:
          'PaaS provides an environment for customers to build and host their own applications; Microsoft 365 users consume a finished product instead of deploying code.',
      },
      {
        id: 'c',
        text: 'Infrastructure as a service (IaaS)',
        explanation:
          'IaaS customers rent virtual machines and networks and manage the operating system themselves, none of which applies to using a hosted email suite.',
      },
      {
        id: 'd',
        text: 'Hybrid cloud',
        explanation:
          'Hybrid cloud is a deployment model describing where infrastructure runs, not a service type describing how much of the stack the provider manages.',
      },
    ],
    correct: ['a'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-021',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'multi',
    stem: 'For which scenarios is infrastructure as a service (IaaS) the most appropriate cloud service type? Select two.',
    options: [
      {
        id: 'a',
        text: 'Migrating existing on-premises virtual machines to the cloud with minimal changes (lift and shift).',
        explanation:
          'Lift-and-shift migrations are a classic IaaS use case because cloud virtual machines can mirror the on-premises servers almost exactly, avoiding application rework.',
      },
      {
        id: 'b',
        text: 'Giving staff a ready-to-use email and calendaring application.',
        explanation:
          'A finished application consumed by end users is a SaaS scenario; standing up your own mail servers on IaaS would add management burden for no benefit.',
      },
      {
        id: 'c',
        text: 'Letting developers deploy web application code without any access to, or responsibility for, the underlying servers.',
        explanation:
          'Hiding the servers from the development team is what PaaS (or serverless) provides; IaaS would make the team responsible for exactly the servers they want to avoid.',
      },
      {
        id: 'd',
        text: 'Running a legacy application that requires a custom operating system configuration.',
        explanation:
          'IaaS is the only service type that gives the customer full control of the operating system, which is essential when an application depends on non-standard OS settings.',
      },
    ],
    correct: ['a', 'd'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-022',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'A development team wants to host a web application and its database while spending no time on operating system patching, hardware capacity, or runtime installation. The team still needs to deploy its own code. Which cloud service type best fits this requirement?',
    options: [
      {
        id: 'a',
        text: 'Infrastructure as a service (IaaS)',
        explanation:
          'IaaS would leave operating system patching and runtime installation with the team, which is exactly the work they want to avoid.',
      },
      {
        id: 'b',
        text: 'Software as a service (SaaS)',
        explanation:
          'SaaS delivers someone else’s finished application, so the team would have no way to deploy its own code.',
      },
      {
        id: 'c',
        text: 'Platform as a service (PaaS)',
        explanation:
          'PaaS removes the operating system, hardware, and runtime maintenance while still accepting customer-deployed applications, which matches every requirement in the scenario.',
      },
      {
        id: 'd',
        text: 'Private cloud',
        explanation:
          'Private cloud is a deployment model, not a service type, and running one would increase rather than remove the team’s infrastructure management workload.',
      },
    ],
    correct: ['c'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-023',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'A 20-person consultancy with no dedicated IT department needs customer relationship management (CRM) software that works immediately from any web browser, with all updates handled by the vendor. Which cloud service type should the consultancy choose?',
    options: [
      {
        id: 'a',
        text: 'Platform as a service (PaaS)',
        explanation:
          'PaaS is aimed at teams that build their own applications; a consultancy with no IT staff wants to consume software, not develop it.',
      },
      {
        id: 'b',
        text: 'Software as a service (SaaS)',
        explanation:
          'SaaS delivers a complete, vendor-maintained application over the internet, which suits an organization that wants working software immediately with no infrastructure to run.',
      },
      {
        id: 'c',
        text: 'Infrastructure as a service (IaaS)',
        explanation:
          'IaaS would require the consultancy to install and maintain servers, an operating system, and the CRM software itself, which it has no staff to do.',
      },
      {
        id: 'd',
        text: 'Serverless computing',
        explanation:
          'Serverless computing runs custom event-driven code without server management; it is a way to build software, not a way to buy a finished CRM product.',
      },
    ],
    correct: ['b'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
  {
    id: 'cc-024',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'multi',
    stem: 'A company deploys a custom web application to a platform as a service (PaaS) offering. Under the shared responsibility model, which items remain the company’s responsibility? Select two.',
    options: [
      {
        id: 'a',
        text: 'Patching the operating system of the hosts that run the platform.',
        explanation:
          'Keeping the operating system patched is one of the main burdens PaaS removes: the provider maintains the OS and runtime on the customer’s behalf.',
      },
      {
        id: 'b',
        text: 'The data the application stores and processes.',
        explanation:
          'Information and data always remain the customer’s responsibility in every service model, including PaaS, so classifying and protecting it stays with the company.',
      },
      {
        id: 'c',
        text: 'Managing the user accounts and identities that access the application.',
        explanation:
          'Accounts and identities are always customer-managed responsibilities across IaaS, PaaS, and SaaS; the provider cannot decide who should have access.',
      },
      {
        id: 'd',
        text: 'Maintaining the physical servers and datacenter network.',
        explanation:
          'Physical hosts, storage, and networking are always the provider’s responsibility in every cloud service model.',
      },
    ],
    correct: ['b', 'c'],
    learnMore: 'https://learn.microsoft.com/azure/security/fundamentals/shared-responsibility',
  },
  {
    id: 'cc-025',
    domain: 'cloud-concepts',
    topic: 'cloud-service-types',
    kind: 'single',
    stem: 'An IT director is comparing cloud service types by how much day-to-day management each one requires from her team. Which ordering, from the most customer management effort to the least, is accurate?',
    options: [
      {
        id: 'a',
        text: 'SaaS, then PaaS, then IaaS',
        explanation:
          'This ordering is reversed: SaaS asks the least of the customer because the provider runs the whole application stack, while IaaS asks the most.',
      },
      {
        id: 'b',
        text: 'PaaS, then IaaS, then SaaS',
        explanation:
          'PaaS cannot require more effort than IaaS, because PaaS hands the operating system and runtime maintenance to the provider while IaaS leaves them with the customer.',
      },
      {
        id: 'c',
        text: 'IaaS, then SaaS, then PaaS',
        explanation:
          'IaaS is correctly placed first, but SaaS and PaaS are swapped: a customer deploying applications on PaaS manages more than one merely using a finished SaaS product.',
      },
      {
        id: 'd',
        text: 'IaaS, then PaaS, then SaaS',
        explanation:
          'Customer effort decreases as the provider takes on more of the stack: IaaS leaves the OS and applications to the customer, PaaS leaves only the applications and data, and SaaS leaves little beyond data, identities, and configuration.',
      },
    ],
    correct: ['d'],
    learnMore: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
  },
]
