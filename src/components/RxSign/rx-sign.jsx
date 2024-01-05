/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import Field from 'terra-form-field';
import Checkbox from 'terra-form-checkbox';
import Select from 'terra-form-select';
import NumberField from 'terra-form/lib/NumberField';
import Text from 'terra-text';
import Input from 'terra-form-input';
import DatePicker from 'terra-date-picker';
import List from 'terra-list';
import Button from 'terra-button';

import debounce from 'debounce';

import cdsExecution from '../../middleware/cds-execution';
import CardList from '../CardList/card-list';
import PatientBanner from '../PatientBanner/patient-banner';
import styles from './rx-sign.css';
import { createFhirResource } from '../../reducers/medication-reducers';

import {
    storeUserMedInput, storeUserChosenMedication,
    storeMedDosageAmount, storeDispenseRequest, storeDate, toggleDate,
    takeSuggestion,
} from '../../actions/medication-sign-actions';

cdsExecution.registerTriggerHandler('rx-sign/order-sign', {
    needExplicitTrigger: false,
    onSystemActions: () => { },
    onMessage: () => { },
    generateContext: (state) => {
        const { fhirVersion } = state.fhirServerState;
        const resource = createFhirResource(fhirVersion, state.patientState.currentPatient.id, state.medicationState);

        return {
            draftOrders: {
                resourceType: 'Bundle',
                entry: [{ resource }],
            },
        };
    },
});

const propTypes = {
    /**
     * Flag to determine if the CDS Developer Panel view is visible
     */
    isContextVisible: PropTypes.bool.isRequired,
    /**
     * Patient resource in context
     */
    patient: PropTypes.object,
    /**
     * Array of medications a user may choose from at a given moment
     */
    medications: PropTypes.arrayOf(PropTypes.object),
    /**
     * Prescribed medicine chosen by the user for the patient
     */
    prescription: PropTypes.object,
    /**
     * Hash detailing the dosage and frequency of the prescribed medicine
     */
    medicationInstructions: PropTypes.object,
    /**
     * Hash detailing the supply duration of the prescribed medicine
     */
    supplyDuration: PropTypes.number,
    /**
     * Hash detailing the start/end dates of the prescribed medication
     */
    prescriptionDates: PropTypes.object,
    /**
     * Function for storing user input when the medication field changes
     */
    onMedicationChangeInput: PropTypes.func.isRequired,
    /**
     * Function to signal a chosen medication
     */
    chooseMedication: PropTypes.func.isRequired,
    /**
     * Function to signal a change in the dosage instructions (amount or frequency)
     */
    updateDosageInstructions: PropTypes.func.isRequired,
    /**
     * Function to signal a change in the dispense request (supplyDuration)
     */
    updateDispenseRequest: PropTypes.func.isRequired,
    /**
     * Function to signal a change in a date (start or end)
     */
    updateDate: PropTypes.func.isRequired,
    /**
     * Function to signal a change in the toggled status of the date (start or end)
     */
    toggleEnabledDate: PropTypes.func.isRequired,
    /**
     * Function callback to take a specific suggestion from a card
     */
    takeSuggestion: PropTypes.func.isRequired,
};

/**
 * Left-hand side on the mock-EHR view that displays the cards and relevant UI for the order-select hook.
 * The services are not called until a medication is chosen, or a change in prescription is made
 */
export class RxSign extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Value of the input box for medication
             */
            value: '',
            /**
             * Tracks the dosage amount chosen from the form field
             */
            dosageAmount: 1,
            /**
             * Tracks the dosage frequency chosen from the form field
             */
            dosageFrequency: 'daily',
            /**
             * Tracks the supply duration chosen from the form field
             */
            supplyDuration: 1,
            /**
             * Tracks the start date value and toggle of the prescription
             */
            startRange: {
                enabled: true,
                value: undefined,
            },
            /**
             * Tracks the end date value and toggle of the prescription
             */
            endRange: {
                enabled: true,
                value: undefined,
            },
        };

        this.changeMedicationInput = this.changeMedicationInput.bind(this);
        this.changeDosageAmount = this.changeDosageAmount.bind(this);
        this.changeDosageFrequency = this.changeDosageFrequency.bind(this);
        this.changeSupplyDuration = this.changeSupplyDuration.bind(this);
        this.selectStartDate = this.selectStartDate.bind(this);
        this.selectEndDate = this.selectEndDate.bind(this);
        this.toggleEnabledDate = this.toggleEnabledDate.bind(this);
    }

    /**
     * Update any incoming values that change for state
     */
    componentWillReceiveProps(nextProps) {
        if (nextProps.medicationInstructions.number !== this.state.dosageAmount
            || nextProps.medicationInstructions.frequency !== this.state.dosageFrequency
            || nextProps.medicationInstructions.supplyDuration !== this.state.supplyDuration
            || nextProps.prescriptionDates.start.value !== this.state.startRange.value
            || nextProps.prescriptionDates.end.value !== this.state.endRange.value) {
            this.setState({
                dosageAmount: nextProps.medicationInstructions.number,
                dosageFrequency: nextProps.medicationInstructions.frequency,
                supplyDuration: nextProps.dispenseRequest.supplyDuration,
                startRange: {
                    enabled: this.state.startRange.enabled,
                    value: nextProps.prescriptionDates.start.value,
                },
                endRange: {
                    enabled: this.state.endRange.enabled,
                    value: nextProps.prescriptionDates.end.value,
                },
            });
        }
    }

    changeMedicationInput(event) {
        this.setState({ value: event.target.value });
        debounce(this.props.onMedicationChangeInput(event.target.value), 50);
    }

    // Note: Bound the dosage amount to a value between 1 and 5
    changeDosageAmount(event) {
        let transformedNumber = Number(event.target.value) || 1;
        if (transformedNumber > 5) { transformedNumber = 5; }
        if (transformedNumber < 1) { transformedNumber = 1; }
        this.setState({ dosageAmount: transformedNumber });
        this.props.updateDosageInstructions(transformedNumber, this.state.dosageFrequency);
    }

    // Note: A second parameter (selected value) is supplied automatically by the Terra onChange function for the Form Select component
    changeDosageFrequency(event, value) {
        this.setState({ dosageFrequency: value });
        this.props.updateDosageInstructions(this.state.dosageAmount, value);
    }

    changeSupplyDuration(event) {
        let transformedNumber = Number(event.target.value) || 1;
        if (transformedNumber > 90) { transformedNumber = 90; }
        if (transformedNumber < 1) { transformedNumber = 1; }
        this.setState( { supplyDuration: transformedNumber } );
        this.props.updateDispenseRequest(transformedNumber, this.state.supplyDuration);
    }

    // Note: A second parameter (date value) is supplied automatically by the Terra onChange function for the DatePicker component
    selectStartDate(event, value) {
        const newStartRange = {
            enabled: this.state.startRange.enabled,
            value,
        };
        this.setState({
            startRange: newStartRange,
        });
        this.props.updateDate('start', newStartRange);
    }

    // Note: A second parameter (date value) is supplied automatically by the Terra onChange function for the DatePicker component
    selectEndDate(event, value) {
        const newEndRange = {
            enabled: this.state.endRange.enabled,
            value,
        };
        this.setState({
            endRange: newEndRange,
        });
        this.props.updateDate('end', newEndRange);
    }

    toggleEnabledDate(event, range) {
        this.setState({ [`${range}Range`]: event.target.value });
        this.props.toggleEnabledDate(range);
    }

    signOrder(event) {
        this.state.medicationState.medListPhase = 'done';
    }

    render() {
        const isHalfView = this.props.isContextVisible ? styles['half-view'] : '';
        const medicationArray = this.props.medications;

        return (
            <div className={cx(styles['rx-sign'], isHalfView)}>
                <h1 className={styles['view-title']}>Rx Sign</h1>
                <PatientBanner />
                <form>
                    <Field
                        label="Medication"
                        labelAttrs={{ className: styles['medication-field'] }}
                    >
                        <Input
                            name="medication-input"
                            value={this.state.value}
                            onChange={this.changeMedicationInput}
                        />
                        <List isDivided>
                            {medicationArray.map((med) => (
                                <List.Item
                                    key={med.id}
                                    content={<p>{med.name}</p>}
                                    isSelectable
                                    onClick={() => { this.props.chooseMedication(med); }}
                                />
                            ))}
                        </List>
                    </Field>
                    {this.props.prescription ? <Text isItalic fontSize={16}>{this.props.prescription.name}</Text> : null}
                    <div className={styles['dose-instruction']}>
                        <NumberField
                            label="Number"
                            name="dosage-amount"
                            className={styles['dosage-amount']}
                            value={this.state.dosageAmount}
                            onChange={this.changeDosageAmount}
                            max={5}
                            min={1}
                            step={1}
                            isInline
                        />
                        <Field label="Frequency" isInline>
                            <Select name="dosage-frequency" onChange={this.changeDosageFrequency} value={this.state.dosageFrequency}>
                                <Select.Option key="daily" value="daily" display="daily" />
                                <Select.Option key="twice-daily" value="bid" display="twice daily" />
                                <Select.Option key="three-daily" value="tid" display="three times daily" />
                                <Select.Option key="four-daily" value="qid" display="four times daily" />
                            </Select>
                        </Field>
                        <NumberField
                            label="Supply Duration (Days)"
                            name="supply-duration"
                            className={styles['supply-duration']}
                            value={this.state.supplyDuration}
                            onChange={this.changeSupplyDuration}
                            max={90}
                            min={1}
                            step={5}
                            isInline
                        />
                    </div>
                    <div className={styles['dosage-timing']}>
                        <Field
                            label={(
                                <div>
                                    Start Date
                                    <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={(e) => this.toggleEnabledDate(e, 'start')} />
                                </div>
                            )}
                            isInline
                        >
                            <DatePicker
                                name="start-date"
                                selectedDate={this.state.startRange.value}
                                onChange={this.selectStartDate}
                            />
                        </Field>
                        <Field
                            label={(
                                <div>
                                    End Date
                                    <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={(e) => this.toggleEnabledDate(e, 'end')} />
                                </div>
                            )}
                            isInline
                        >
                            <DatePicker
                                name="end-date"
                                selectedDate={this.state.endRange.value}
                                onChange={this.selectEndDate}
                            />
                        </Field>
                    </div>
                    {/*<div>*/}
                    {/*    <Field label="" isInline>*/}
                    {/*        <Button*/}
                    {/*            text="Sign Order"*/}
                    {/*            variant="action"*/}
                    {/*            onClick={this.signOrder}*/}
                    {/*        />*/}
                    {/*    </Field>*/}
                    {/*</div>*/}
                </form>
                <CardList takeSuggestion={this.props.takeSuggestion} />
            </div>
        );
    }
}

RxSign.propTypes = propTypes;

const mapStateToProps = (state) => ({
    isContextVisible: state.hookState.isContextVisible,
    patient: state.patientState.currentPatient,
    medications: state.medicationState.options[state.medicationState.medListPhase] || [],
    prescription: state.medicationState.decisions.prescribable,
    medicationInstructions: state.medicationState.medicationInstructions,
    dispenseRequest: state.medicationState.dispenseRequest,
    prescriptionDates: state.medicationState.prescriptionDates,
});

const mapDispatchToProps = (dispatch) => (
    {
        onMedicationChangeInput: (input) => {
            dispatch(storeUserMedInput(input));
        },
        chooseMedication: (medication) => {
            dispatch(storeUserChosenMedication(medication));
        },
        updateDosageInstructions: (amount, frequency) => {
            dispatch(storeMedDosageAmount(amount, frequency));
        },
        updateDispenseRequest: (supplyDuration) => {
            dispatch(storeDispenseRequest(supplyDuration))
        },
        updateDate: (range, date) => {
            dispatch(storeDate(range, date));
        },
        toggleEnabledDate: (range) => {
            dispatch(toggleDate(range));
        },
        takeSuggestion: (suggestion) => {
            dispatch(takeSuggestion(suggestion));
        },
    }
);

export default connect(mapStateToProps, mapDispatchToProps)(RxSign);
