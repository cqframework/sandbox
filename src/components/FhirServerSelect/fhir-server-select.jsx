import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Text from 'terra-text';
import Field from 'terra-form-field';
import CreatableSelect from 'react-select/creatable'; // <-- Important: from creatable
import styles from './fhir-server-select.css';

const propTypes = {
    /**
     * If the modal needs to present the current FHIR server at the top, pass this prop in
     */
    currentFhirServer: PropTypes.string,
    /**
     * The field label for the Field component (e.g. "Change Patient")
     */
    formFieldLabel: PropTypes.string.isRequired,
    /**
     * A boolean flag to display an error if needed on the Field component
     */
    shouldDisplayError: PropTypes.bool.isRequired,
    /**
     * If an error needs to be displayed in the Field component, provide a message
     */
    errorMessage: PropTypes.string,
    /**
     * Placeholder text (usually to help the user with example values)
     */
    placeholderText: PropTypes.string,
    /**
     * Called whenever the selected dropdown option changes
     */
    inputOnChange: PropTypes.func.isRequired,
    /**
     * The name attribute for the dropdown
     */
    inputName: PropTypes.string,
};

/**
 * FhirServerSelect (functional component) provides:
 * 1) A display for the current FHIR server (if provided).
 * 2) A Field + CreatableSelect combination for user input, allowing new options to be created.
 */
const FhirServerSelect = ({
                              currentFhirServer,
                              formFieldLabel,
                              shouldDisplayError,
                              errorMessage,
                              placeholderText,
                              inputOnChange,
                              inputName,
                          }) => {

    const initialOptions = [
        {
            value: 'https://launch.smarthealthit.org/v/r2/fhir',
            label: 'Default (DSTU2): https://launch.smarthealthit.org/v/r2/fhir',
        },
        {
            value: 'https://opioid-sandbox.cqframework.org/cdc/opioid-cds-r4/ehr/fhir',
            label: 'Opioid IG Content (R4): https://opioid-sandbox.cqframework.org/cdc/opioid-cds-r4/ehr/fhir',
        },
    ];

    // Keep a local list of options, so we can append user-created options.
    const [options, setOptions] = useState(initialOptions);

    const serverDisplay = currentFhirServer && (
        <div>
            <Text weight={400} fontSize={16}>Current FHIR server</Text>
            <br />
            <Text weight={200} fontSize={14}>{currentFhirServer}</Text>
        </div>
    );

    // Called whenever a user selects (or clears) an option.
    const handleSelectChange = (selectedOption) => {
        // selectedOption is either { value, label } or null if cleared
        inputOnChange(selectedOption);
    };

    // Called when the user creates a new option (by typing a value not in the list and pressing Enter).
    const handleCreateOption = (inputValue) => {
        const newOption = { value: inputValue, label: inputValue };
        setOptions((prev) => [...prev, newOption]); // Add new option to the local list
        handleSelectChange(newOption); // Also select it immediately
    };

    return (
        <div className={styles.container}>
            {serverDisplay}
            <div className={styles['vertical-separation']}>
                <Field
                    label={formFieldLabel}
                    isInvalid={shouldDisplayError}
                    error={errorMessage}
                    required
                >
                    <CreatableSelect
                        name={inputName}
                        placeholder={placeholderText}
                        options={options}
                        onChange={handleSelectChange}
                        onCreateOption={handleCreateOption}  // <-- Let user create a new option
                        isClearable
                    />
                </Field>
            </div>
        </div>
    );
};

FhirServerSelect.propTypes = propTypes;

export default FhirServerSelect;
