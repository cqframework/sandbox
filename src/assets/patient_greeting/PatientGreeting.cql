library PatientGreeting version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

context Patient

define "Greet Patient?": true

define "Get Patient Greeting":
    if exists(Patient.name.given)
        then 'Now seeing: ' + Patient.name.given[0]
    else 'Now seeing Patient with ID: ' + Patient.id