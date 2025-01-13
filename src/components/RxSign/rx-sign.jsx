/* eslint-disable react/forbid-prop-types */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import forIn from 'lodash/forIn';
import cx from 'classnames';

import Field from 'terra-form-field';
import Select from 'react-select';
import Form from 'react-bootstrap/Form';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import SelectField from 'terra-form-select';
import InputField from 'terra-form-input';
import DatePicker from 'terra-date-picker';
import Button from 'terra-button';

import cdsExecution from '../../middleware/cds-execution';
import CardList from '../CardList/card-list';
import PatientBanner from '../PatientBanner/patient-banner';
import LazyMedSearchSelect from '../LazyMedSearchSelect/lazy-med-search-select';

import styles from './rx-sign.css';

import {createFhirResource} from '../../reducers/medication-reducers';

import {
  storeUserChosenCondition,
  storeUserChosenMedication,
  storeMedDosageAmount,
  storeDispenseRequest,
  storeDate,
  toggleDate,
  takeSuggestion,
  signOrder,
} from '../../actions/medication-sign-actions';

import * as types from '../../actions/action-types';

// Register a trigger handler for rx-sign
cdsExecution.registerTriggerHandler('rx-sign/order-sign', {
  needExplicitTrigger: types.ORDER_SIGN_BUTTON_PRESS,
  onSystemActions: () => {},
  onMessage: () => {},
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
  isContextVisible: PropTypes.bool.isRequired,
  patient: PropTypes.object,
  medications: PropTypes.arrayOf(PropTypes.object),
  prescription: PropTypes.object,
  medicationInstructions: PropTypes.object,
  dispenseRequest: PropTypes.object,
  prescriptionDates: PropTypes.object,
  selectedConditionCode: PropTypes.string,
  chooseMedication: PropTypes.func.isRequired,
  chooseCondition: PropTypes.func.isRequired,
  updateDosageInstructions: PropTypes.func.isRequired,
  updateDispenseRequest: PropTypes.func.isRequired,
  updateDate: PropTypes.func.isRequired,
  toggleEnabledDate: PropTypes.func.isRequired,
  signOrder: PropTypes.func.isRequired,
  takeSuggestion: PropTypes.func.isRequired,
};

export class RxSign extends Component {
  state = {
    /** Value of the chosen medication label. */
    medicationValue: '',
    /** Currently chosen condition code, used for the condition dropdown. */
    conditionCode: '',
    conditionDisplay: '',
    /** Dosage instructions. */
    dosageAmount: 1,
    dosageFrequency: 'daily',
    /** Supply duration in days. */
    supplyDuration: 1,
    /** Start date object with an `enabled` flag and a `value` date string. */
    startRange: {
      enabled: true,
      value: undefined,
    },
    /** End date object with an `enabled` flag and a `value` date string. */
    endRange: {
      enabled: true,
      value: undefined,
    },
  };

  componentDidUpdate(prevProps) {
    const {
      medicationInstructions,
      selectedConditionCode,
      prescriptionDates,
    } = this.props;

    // Compare relevant props to previous props
    if (
        prevProps.medicationInstructions.number !== medicationInstructions.number ||
        prevProps.medicationInstructions.frequency !== medicationInstructions.frequency ||
        prevProps.medicationInstructions.supplyDuration !== medicationInstructions.supplyDuration ||
        prevProps.selectedConditionCode !== selectedConditionCode ||
        prevProps.prescriptionDates.start.value !== prescriptionDates.start.value ||
        prevProps.prescriptionDates.end.value !== prescriptionDates.end.value
    ) {
      // Update local state if any changed
      this.setState({
        conditionCode: selectedConditionCode,
        dosageAmount: medicationInstructions.number,
        dosageFrequency: medicationInstructions.frequency,
        supplyDuration: medicationInstructions.supplyDuration,
        startRange: {
          ...this.state.startRange,
          value: prescriptionDates.start.value,
        },
        endRange: {
          ...this.state.endRange,
          value: prescriptionDates.end.value,
        },
      });
    }
  }

  /**
   * Builds an array of { value, label } objects from the patient's conditions.
   */
  createDropdownConditions = () => {
    const conditions = [];
    const { conditionsResources } = this.props.patient || {};
    forIn(conditionsResources, (conditionObj) => {
      const { code, text } = conditionObj.resource.code;
      conditions.push({
        value: code?.[0]?.code,
        label: text,
      });
    });
    return conditions;
  };

  selectMedication = (selected) => {
    if (!selected) {
      this.props.chooseMedication({ id: '', name: '' });
      this.setState({ medicationValue: '' });
    } else {
      this.props.chooseMedication({ id: selected.value, name: selected.label });
      this.setState({ medicationValue: selected.label });
    }
  };

  selectCondition = (selected) => {
    if (!selected) return;
    this.props.chooseCondition(selected.value);
    this.setState({
      conditionCode: selected.value,
      conditionDisplay: selected.label,
    });
  };

  changeDosageAmount = (e) => {
    let amount = Number(e.target.value) || 1;
    amount = Math.min(Math.max(1, amount), 5);
    this.setState({ dosageAmount: amount });
    this.props.updateDosageInstructions(amount, this.state.dosageFrequency);
  };

  changeDosageFrequency = (event, frequency) => {
    this.setState({ dosageFrequency: frequency });
    this.props.updateDosageInstructions(this.state.dosageAmount, frequency);
  };

  changeSupplyDuration = (e) => {
    let duration = Number(e.target.value) || 1;
    duration = Math.min(Math.max(1, duration), 90);
    this.setState({ supplyDuration: duration });
    this.props.updateDispenseRequest(duration);
  };

  selectStartDate = (event, dateValue) => {
    const { startRange } = this.state;
    const newStart = { ...startRange, value: dateValue };
    this.setState({ startRange: newStart });
    this.props.updateDate('start', newStart);
  };

  selectEndDate = (event, dateValue) => {
    const { endRange } = this.state;
    const newEnd = { ...endRange, value: dateValue };
    this.setState({ endRange: newEnd });
    this.props.updateDate('end', newEnd);
  };

  toggleEnabledDate = (event, range) => {
    // example usage if needed
    this.props.toggleEnabledDate(range);
  };

  signOrderHandler = (e) => {
    this.props.signOrder(e);
  };

  // Helper for react-bootstrap OverlayTrigger + Tooltip
  renderTooltip = (id, message) => (
      <Tooltip id={id}>{message}</Tooltip>
  );

  render() {
    const {
      dosageAmount,
      dosageFrequency,
      supplyDuration,
      startRange,
      endRange,
      conditionDisplay,
      medicationValue,
    } = this.state;

    const { isContextVisible, dispenseRequest, takeSuggestion } = this.props;
    const isHalfView = isContextVisible ? styles['half-view'] : '';

    return (
        <div className={cx(styles['rx-sign'], isHalfView)}>
          <h1 className={styles['view-title']}>Rx Sign</h1>
          <PatientBanner />
          <form>
            {/* Condition select */}
            <Field
                label={(
                    <OverlayTrigger
                        placement="top"
                        overlay={this.renderTooltip('treating-tooltip', 'Select the condition being treated. This list may be empty.')}
                    >
                      <span>Treating</span>
                    </OverlayTrigger>
                )}
                labelAttrs={{ className: styles['condition-select'] }}
            >
              <Select
                  placeholder={conditionDisplay}
                  value={conditionDisplay}
                  options={this.createDropdownConditions()}
                  onChange={this.selectCondition}
              />
            </Field>

            {/* Medication select */}
            <Field
                label={(
                    <OverlayTrigger
                        placement="top"
                        overlay={this.renderTooltip('medication-tooltip', 'Search for a medication.')}
                    >
                      <span>Medication</span>
                    </OverlayTrigger>
                )}
                labelAttrs={{ className: styles['medication-field'] }}
                required
            >
              <LazyMedSearchSelect onChange={this.selectMedication} value={medicationValue} />
            </Field>

            <div className={styles['dose-instruction']}>
              {/* Dosage amount */}
              <Field
                  label={(
                      <OverlayTrigger
                          placement="top"
                          overlay={this.renderTooltip(
                              'dosage-amount-tooltip',
                              'How many units/doses per administration (1–5).',
                          )}
                      >
                        <span>Number</span>
                      </OverlayTrigger>
                  )}
                  labelAttrs={{ className: styles['dosage-amount'] }}
                  isInline
              >
                <InputField
                    inputId="dosage-amount"
                    label=""
                    type="number"
                    value={dosageAmount}
                    onChange={this.changeDosageAmount}
                    inputAttrs={{ name: 'dosage-amount' }}
                />
                <Form.Range
                    value={dosageAmount}
                    onChange={this.changeDosageAmount}
                    min={1}
                    max={5}
                />
              </Field>

              {/* Frequency */}
              <Field
                  label={(
                      <OverlayTrigger
                          placement="top"
                          overlay={this.renderTooltip(
                              'frequency-tooltip',
                              'How often per day the medication is taken.',
                          )}
                      >
                        <span>Frequency</span>
                      </OverlayTrigger>
                  )}
                  isInline
              >
                <SelectField
                    name="dosage-frequency"
                    onChange={this.changeDosageFrequency}
                    value={dosageFrequency}
                >
                  <SelectField.Option key="daily" value="daily" display="daily" />
                  <SelectField.Option key="bid" value="bid" display="twice daily" />
                  <SelectField.Option key="tid" value="tid" display="three times daily" />
                  <SelectField.Option key="qid" value="qid" display="four times daily" />
                </SelectField>
              </Field>

              {/* Supply Duration */}
              <Field
                  label={(
                      <OverlayTrigger
                          placement="top"
                          overlay={this.renderTooltip(
                              'supply-duration-tooltip',
                              'Total number of days this prescription should cover (1–90).',
                          )}
                      >
                        <span>Supply Duration (Days)</span>
                      </OverlayTrigger>
                  )}
                  labelAttrs={{ className: styles['supply-duration'] }}
                  isInline
              >
                <InputField
                    inputId="supply-duration"
                    label=""
                    type="number"
                    value={dispenseRequest.supplyDuration || supplyDuration}
                    onChange={this.changeSupplyDuration}
                    inputAttrs={{ name: 'supply-duration' }}
                />
                <Form.Range
                    value={dispenseRequest.supplyDuration || supplyDuration}
                    onChange={this.changeSupplyDuration}
                    min={1}
                    max={90}
                />
              </Field>
            </div>

            <div className={styles['dosage-timing']}>
              {/* Start Date */}
              <Field
                  label={(
                      <OverlayTrigger
                          placement="top"
                          overlay={this.renderTooltip(
                              'start-date-tooltip',
                              'Select the date this prescription begins.',
                          )}
                      >
                        <span>Start Date</span>
                      </OverlayTrigger>
                  )}
                  isInline
              >
                <DatePicker
                    name="start-date"
                    selectedDate={startRange.value}
                    onChange={this.selectStartDate}
                />
              </Field>

              {/* End Date */}
              <Field
                  label={(
                      <OverlayTrigger
                          placement="top"
                          overlay={this.renderTooltip(
                              'end-date-tooltip',
                              'Select the date this prescription ends.',
                          )}
                      >
                        <span>End Date</span>
                      </OverlayTrigger>
                  )}
                  isInline
              >
                <DatePicker
                    name="end-date"
                    selectedDate={endRange.value}
                    onChange={this.selectEndDate}
                />
              </Field>
            </div>

            <Field label="" isInline>
              <Button text="Sign Order" variant="action" onClick={this.signOrderHandler} />
            </Field>
          </form>

          {/* CardList for additional suggestions */}
          <CardList takeSuggestion={takeSuggestion} />
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
  selectedConditionCode: state.medicationState.conditionCode,
});

const mapDispatchToProps = (dispatch) => ({
  chooseMedication: (medication) => dispatch(storeUserChosenMedication(medication)),
  chooseCondition: (condition) => dispatch(storeUserChosenCondition(condition)),
  updateDosageInstructions: (amount, frequency) => dispatch(storeMedDosageAmount(amount, frequency)),
  updateDispenseRequest: (supplyDuration) => dispatch(storeDispenseRequest(supplyDuration)),
  updateDate: (range, date) => dispatch(storeDate(range, date)),
  toggleEnabledDate: (range) => dispatch(toggleDate(range)),
  signOrder: (evt) => dispatch(signOrder(evt)),
  takeSuggestion: (suggestion) => dispatch(takeSuggestion(suggestion)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RxSign);
