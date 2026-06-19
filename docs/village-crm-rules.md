# Village CRM/ERM Rules

Last updated: 2026-06-18

Source: `C:\Users\User\Downloads\The village ERM Complete Requirements v2.0.pdf`.

This document captures the CRM/ERM model supplied for Moto and Co Couriers. The source PDF is a generic product specification for The Village. It should guide the runtime model, but it does not by itself decide which features are in release one.

## Product Boundary

The Village is an Ecosystem Relationship Management runtime.

It manages three relationship domains inside one operating model:

- SRM: Supplier Relationship Management, `RM10.1`.
- PRM: Partner Relationship Management, `RM10.2`.
- CRM: Customer Relationship Management, `RM10.3`.

For Moto and Co Couriers, the immediate confirmed relevance is:

- Suppliers for pickup source management.
- Customers/workshops for delivery/customer CRM.
- Internal owners and contacts for accountability.
- Obligations, events, and records that support booking, delivery, billing, exceptions, and disputes.

Confirmed release-one scope:

- Use a lean subset of the Village model.
- Include actors.
- Include contacts.
- Include events.
- Include obligations.
- Include courier-specific operational tables for booking, pickup, delivery, POD, pricing, exceptions, billing, and audit.
- Defer relationship records unless a source policy or workflow requires them for release one.
- Defer opportunities.
- Defer partner relationship management.
- Defer relationship health scoring.

TBD:

- Whether advisors, regulators, or other actor types are used in release one.

## RM10 Capability Shape

The RM10 framework uses the same six capabilities across supplier, partner, and customer domains:

- Strategy: plan or segmentation.
- Strategy: engagement.
- Strategy: collaboration.
- Execution: data.
- Execution: contacts.
- Execution: monitoring.

Release-one implication:

- Supplier and customer/workshop records should use the same core relationship model where practical.
- Differences between suppliers and customers should be handled by actor type, relationship type, workflows, and permissions, not by unrelated record structures unless a policy requires it.

## Core Object Model

The Village operates around five core object types:

- Actor: a person or organisation in the business ecosystem.
- Relationship: a typed directional connection between actors.
- Obligation: a commitment between actors.
- Opportunity: a potential future value exchange.
- Event: a material interaction, decision, activity, or signal recorded against an actor or relationship.

Release-one implication:

- Suppliers and workshops should be represented as actors.
- Customer/workshop contacts should be represented as contacts linked to actors.
- Booking, delivery, exception, dispute, billing, and POD-related relationship history should create events where they materially affect the relationship.
- Payment terms, agreed actions, and service obligations should be modelled as obligations where needed.

TBD:

- Whether a separate `relationships` table is needed immediately, or whether actor ownership and actor type are sufficient for release one.
- Whether relationship records are needed for a specific release-one workflow or can be deferred.

## Source Table Model

The source specification identifies these structural tables:

- Actor.
- Contact.
- Relationship Record.
- Event.
- Obligation.
- Opportunity.

### Actor Fields From Source

- `actor_id`.
- `actor_type`.
- `legal_name`.
- `trading_name`.
- `relationship_tier`.
- `relationship_status`.
- `relationship_owner`.
- `health_score`.
- `first_engagement_date`.
- `last_engagement_date`.
- `risk_level`.
- `notes`.

Source actor type values:

- Customer.
- Supplier.
- Partner.
- Advisor.
- Regulator.
- Other.

Source relationship tier values:

- Transactional.
- Preferred.
- Strategic.
- Co-creation.

Source relationship status values:

- Active.
- Inactive.
- At-Risk.
- Suspended.
- Closed.

Source risk level values:

- Low.
- Medium.
- High.
- Critical.

### Contact Fields From Source

- `contact_id`.
- `actor_id`.
- `full_name`.
- `role_title`.
- `influence_role`.
- `email`.
- `phone`.
- `preferred_contact_method`.
- `last_contact_date`.
- `notes`.

Source influence role values:

- Economic Buyer.
- Technical Buyer.
- End User.
- Influencer.
- Blocker.
- Executive Sponsor.
- Operational Lead.

Source contact method values:

- Email.
- Phone.
- In Person.
- Video.

### Relationship Record Fields From Source

- `record_id`.
- `actor_id`.
- `record_type`.
- `title`.
- `status`.
- `owner`.
- `review_date`.
- `body`.
- `created_date`.
- `last_updated`.

Source record type values:

- Relationship Plan.
- Engagement Plan.
- Collaboration Plan.
- Risk Register.
- Opportunity.

Source record status values:

- Draft.
- Active.
- Under Review.
- Closed.

### Event Fields From Source

- `event_id`.
- `actor_id`.
- `event_type`.
- `event_date`.
- `description`.
- `outcome`.
- `next_action`.
- `next_action_owner`.
- `next_action_due`.
- `created_by`.
- `health_impact`.

Source event type values:

- Meeting.
- Call.
- Email.
- Decision.
- Issue.
- Commitment.
- Performance Signal.
- Sentiment Signal.
- Other.

Source health impact values:

- Positive.
- Neutral.
- Negative.

### Obligation Fields From Source

- `obligation_id`.
- `actor_id`.
- `obligation_type`.
- `title`.
- `description`.
- `direction`.
- `due_date`.
- `status`.
- `value`.
- `risk_if_breached`.

Source obligation type values:

- Contract.
- SLA.
- Payment Term.
- Regulatory Commitment.
- Agreed Action.
- Other.

Source direction values:

- We owe them.
- They owe us.
- Mutual.

Source obligation status values:

- Active.
- Fulfilled.
- Overdue.
- Disputed.
- Terminated.

### Opportunity Fields From Source

- `opportunity_id`.
- `actor_id`.
- `opportunity_type`.
- `title`.
- `description`.
- `estimated_value`.
- `probability`.
- `status`.
- `owner`.
- `target_close_date`.

Source opportunity type values:

- Revenue.
- Cost Reduction.
- Innovation.
- Joint Go-to-Market.
- Capability Build.
- Risk Mitigation.

Source opportunity status values:

- Identified.
- Qualifying.
- Active.
- Won.
- Lost.
- Deferred.

## Relationship Lifecycle

Source lifecycle stages:

- Identification.
- Qualification.
- Development.
- Deepening.
- Optimisation.
- Review.
- Transition or Closure.

Release-one implication:

- New suppliers and customer/workshops should have an explicit relationship status and lifecycle stage or equivalent state.
- Closure should retain the relationship record for institutional memory, subject to privacy and retention policies.

TBD:

- Whether lifecycle stage is separate from `relationship_status` in release one.

## Health Score Model

The source specification defines relationship health as a 0-100 composite score across six dimensions:

- Engagement Health, 20%.
- Performance Health, 20%.
- Sentiment Health, 15%.
- Commercial Health, 20%.
- Risk Health, 15%.
- Opportunity Health, 10%.

Source score bands:

- Above 75: healthy.
- 50 to 75: requires attention.
- Below 50: requires intervention.
- Below 25: relationship in crisis.

Release-one implication:

- The schema should not block future health scoring.
- If health scoring is not implemented at launch, fields should be nullable or explicitly marked as not calculated yet.

Deferred for release one:

- Whether health dimensions are manually assessed, rule-calculated, or AI-assisted.
- What Moto-specific signals feed each health dimension.

## Operating Rhythm

Source cadence model:

- Daily: open issue monitoring, signal review, urgent communication.
- Weekly: active account health check, next-action review, pipeline update.
- Monthly: touchpoint call or meeting, performance update, open actions review.
- Quarterly: business review covering performance, commercial, and strategic alignment.
- Annually: full relationship review covering tier assessment, contract renewal, and joint planning.

Release-one implication:

- CRM records should support relationship owner, next action, next action due date, review date, and open issue visibility.

TBD:

- Which cadences are mandatory for Moto and Co Couriers release one.
- Whether QBRs and annual reviews are relevant at launch.

## Governance Principles

Source governance principles:

- Every relationship has a named internal owner.
- Health scores prompt human review and do not replace judgment.
- Obligations are tracked to completion.
- Data quality is a leadership responsibility.
- Ecosystem health should be reviewed at leadership level.

Release-one implication:

- Supplier and customer/workshop records should require an internal owner.
- Open obligations and next actions should be visible to Admin.
- The app should make stale, incomplete, or at-risk records visible rather than silently accepting them.

## Integration Principles

The Village must be fully operational without external system connection. Integrations are enhancements, not dependencies.

Relevant integration directions:

- CRM platforms may be a source, but The Village can become the master ecosystem record in mature deployments.
- ERP and financial systems can sync obligation and commercial data.
- Email/calendar/messaging can support event logging and cadence management.
- Document and contract systems can link authoritative documents while The Village stores summary obligations.
- Procurement and supplier platforms can enrich supplier records.

Release-one implication:

- The Moto and Co Couriers runtime should not depend on Zoho, HubSpot, Salesforce, or another external CRM to function at launch unless a separate decision confirms that dependency.
- Zoho Books integration can be deferred if manual billing/export rules are approved.

## Do Not Assume Yet

- Do not assume all RM10 capabilities are in release one.
- Do not include AI-assisted health scoring in release one without a later decision.
- Do not include partner management in release one without a later decision.
- Do not include opportunities in release one without a later decision.
- Do not assume exact Moto-specific cadence rules until they are confirmed.
