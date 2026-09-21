# Onboarding scenarios

The top controls restart the local flow, letting you combine either location with any insurance lookup result:

- **In Texas / Outside Texas:** outside-Texas users can confirm they will be physically in Texas for their visit or see care resources. All bookings retain a physical-location confirmation.
- **Found · $25 copay:** a complete commercial Aetna coverage response, confirmed by the patient, filters providers and supplies a $25 estimated initial-visit copay. Post-booking insurance is complete.
- **Not found · manual entry:** the original Medicare/Medicaid question, insurer picker, and post-booking verification remain. No match does not mean uninsured.
- **Found · cost pending:** insurance details are available but visit benefits are incomplete. Insurance data entry is skipped; the personalized price remains pending.

Name and DOB are collected once before discovery; age eligibility is derived from DOB. Clinical fit questions remain. Users can decline the lookup or correct the discovered coverage to use the manual path.

All lookup responses, coverage, network decisions, and prices are deterministic fixtures. No Verified, payer, payment, or booking API is called. Consent text is illustrative and must be replaced with Verified-approved production consent and branding before integration. The found fixture assumes successful plan classification and complete discovery of coverage; production must handle secondary insurance and indeterminate eligibility explicitly. A mailing address does not establish physical visit location.

Run checks: `node --test tests/*.test.mjs`.
