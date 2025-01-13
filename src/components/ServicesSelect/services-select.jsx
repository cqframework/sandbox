import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Field from 'terra-form-field';
import CreatableSelect from 'react-select/creatable'; // <-- Important: from creatable
import styles from './fhir-server-select.css';

const propTypes = {
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
 * ServicesSelect (functional component) provides:
 * 1) A Field + CreatableSelect combination for user input, allowing new options to be created.
 */
const ServicesSelect = ({
                              formFieldLabel,
                              shouldDisplayError,
                              errorMessage,
                              placeholderText,
                              inputOnChange,
                              inputName,
                          }) => {

    const initialOptions = [
        {
            value: 'https://sandbox-services.cds-hooks.org/cds-services',
            label: 'Default (DSTU2): https://sandbox-services.cds-hooks.org/cds-services',
        },
        {
            value: 'https://opioid-sandbox.cqframework.org/cdc/opioid-cds-r4/cds-service/cds-services',
            label: 'Opioid IG Content (R4): https://opioid-sandbox.cqframework.org/cdc/opioid-cds-r4/cds-service/cds-services',
        },
    ];

    // Keep a local list of options, so we can append user-created options.
    const [options, setOptions] = useState(initialOptions);

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
                    />
                </Field>
            </div>
        </div>
    );
};

ServicesSelect.propTypes = propTypes;

export default ServicesSelect;
