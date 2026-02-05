/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import forIn from 'lodash/forIn';
import axios from 'axios';

import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MuiButton from '@mui/material/Button';
import Select from 'react-select';
import ExchangePanel from '../ExchangePanel/exchange-panel';
import MessagePanel from '../MessagePanel/message-panel';

import styles from './context-view.css';

import { selectService, storeExchange } from '../../actions/service-exchange-actions';
import { setContextVisibility } from '../../actions/ui-actions';
import { getServicesByHook } from '../../reducers/helpers/services-filter';
import generateJWT from '../../retrieve-data-helpers/jwt-generator';

const propTypes = {
  /**
   * Callback function that sets the user-selected CDS service from the dropdown of available services to display
   * a request and response for
   */
  selectService: PropTypes.func.isRequired,
  /**
   * Function to toggle the context view visibility (hide/show button)
   */
  toggleContext: PropTypes.func.isRequired,
  /**
   * Hash of available CDS services configured in the Sandbox
   */
  services: PropTypes.object,
  /**
   * User-selected CDS service to display a request/response for in the context view
   */
  selectedService: PropTypes.string,
  /**
   * Default CDS service to display a request/response for in the context view
   */
  initialService: PropTypes.string,
  /**
   * Hash containing the service exchanges per service (request and response)
   */
  exchanges: PropTypes.object,
  /**
   * Flag to determine if the context view will be visible or not (via the slide out button)
   */
  isContextVisible: PropTypes.bool.isRequired,
  /**
   * Function to store a service exchange (request/response) in the Redux store
   */
  storeExchange: PropTypes.func.isRequired,
};

/**
 * The right hand side of the Sandbox that displays the CDS Developer Panel. It encompasses
 * ExchangePanel components that display the request/response. This view may be toggled by the user
 * to hide/show this view.
 */
export class ContextView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEditingRequest: false,
      draftRequest: '',
    };
    this.onSelectChange = this.onSelectChange.bind(this);
    this.createDropdownServices = this.createDropdownServices.bind(this);
    this.onContextToggle = this.onContextToggle.bind(this);
    this.formatOptionLabel = this.formatOptionLabel.bind(this);
    this.onEditRequest = this.onEditRequest.bind(this);
    this.onCancelEdit = this.onCancelEdit.bind(this);
    this.onDraftChange = this.onDraftChange.bind(this);
    this.onResend = this.onResend.bind(this);
  }

  /**
   * When a CDS Service is selected from the dropdown of services, this triggers a state
   * update so that a new request/response will appear in the appropriate exchange panels
   */
  onSelectChange(e) {
    this.props.selectService(e.value);
  }

  /**
   * When the Context View toggle is clicked, this triggers a state update so that the
   * Context View is hidden or expanded to allow the EHR view to take 100% width
   */
  onContextToggle() {
    this.props.toggleContext();
  }

  onEditRequest() {
    const serviceInContext = this.props.selectedService || this.props.initialService;
    const serviceExchange = serviceInContext ? this.props.exchanges[serviceInContext] : null;
    const request = serviceExchange ? serviceExchange.request : '';
    const draft = typeof request === 'string' ? request : JSON.stringify(request, null, 2);
    this.setState({ isEditingRequest: true, draftRequest: draft });
  }

  onCancelEdit() {
    this.setState({ isEditingRequest: false });
  }

  onDraftChange(e) {
    this.setState({ draftRequest: e.target.value });
  }

  async onResend() {
    const serviceUrl = this.props.selectedService || this.props.initialService;
    if (!serviceUrl) return;

    let parsedRequest;
    try {
      parsedRequest = JSON.parse(this.state.draftRequest);
    } catch (e) {
      parsedRequest = this.state.draftRequest;
    }

    try {
      const result = await axios({
        method: 'post',
        url: serviceUrl,
        data: parsedRequest,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${generateJWT(serviceUrl)}`,
        },
      });
      this.props.storeExchange(serviceUrl, parsedRequest, result.data, result.status);
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const response = err.response ? err.response.data : err.message;
      this.props.storeExchange(serviceUrl, parsedRequest, response, status);
    }

    this.setState({ isEditingRequest: false });
  }

  /**
   * Create an array of key-value pair objects that React Select component understands
   * given the CDS Services allowed to be selected for this hook
   */
  createDropdownServices() {
    const services = [];
    forIn(this.props.services, (service, key) => {
      services.push({
        value: key,
        label: service.id,
        url: key,
      });
    });
    return services;
  }

  /**
   * Custom label formatter for react-select to display service ID and truncated URL
   */
  formatOptionLabel(option) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
        <div style={{ fontWeight: 600 }}>{option.label}</div>
        <div style={{
          fontSize: '0.85em',
          color: '#666',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        >
          {option.url}
        </div>
      </div>
    );
  }

  render() {
    let serviceExchange;
    const serviceInContext = this.props.selectedService || this.props.initialService;
    if (serviceInContext) {
      serviceExchange = this.props.exchanges[serviceInContext];
    }

    let contextToggledClass = '';
    if (this.props.isContextVisible) {
      contextToggledClass = styles['context-open'];
    }

    // Find the selected option object for proper display
    const dropdownOptions = this.createDropdownServices();
    const selectedOption = dropdownOptions.find((opt) => opt.value === serviceInContext);

    return (
      <div className={cx(styles.container, contextToggledClass)}>
        <div className={styles['wrap-context']}>
          <h1 className={styles.title}>CDS Developer Panel</h1>
          <FormControl fullWidth margin="normal">
            <FormLabel>Select a Service</FormLabel>
            <Select
              placeholder="Select a service..."
              value={selectedOption}
              options={dropdownOptions}
              onChange={this.onSelectChange}
              formatOptionLabel={this.formatOptionLabel}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '60px',
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: '8px',
                }),
              }}
            />
          </FormControl>
          {this.state.isEditingRequest ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
                <MuiButton variant="outlined" size="small" onClick={this.onCancelEdit}>Cancel</MuiButton>
                <MuiButton variant="contained" size="small" onClick={this.onResend}>Resend</MuiButton>
              </div>
              <textarea
                value={this.state.draftRequest}
                onChange={this.onDraftChange}
                className={styles['edit-textarea']}
              />
            </div>
          ) : (
            <div>
              <ExchangePanel
                panelHeader=" Request"
                panelText={serviceExchange ? serviceExchange.request : 'No request made to CDS Service'}
                isExpanded={false}
              />
              {serviceExchange && serviceExchange.request && (
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <MuiButton variant="outlined" size="small" onClick={this.onEditRequest}>Edit Request</MuiButton>
                </div>
              )}
            </div>
          )}
          <ExchangePanel
            panelHeader=" Response"
            panelText={serviceExchange ? serviceExchange.response : 'No response made to CDS Service'}
            isExpanded
          />
          <hr />
          <MessagePanel
            panelHeader=" Messages"
            isExpanded
          />
        </div>
        <button onClick={this.onContextToggle} className={styles['context-toggle']}>
          CDS Developer Panel
        </button>
      </div>
    );
  }
}

ContextView.propTypes = propTypes;

const mapStateToProps = (store) => {
  function getFirstServiceForHook(services) {
    const serviceKeys = Object.keys(services);
    if (serviceKeys.length) {
      return serviceKeys[0];
    }
    return null;
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    services: getServicesByHook(store.hookState.currentHook, store.cdsServicesState.configuredServices),
    selectedService: store.serviceExchangeState.selectedService,
    initialService: getFirstServiceForHook(getServicesByHook(store.hookState.currentHook, store.cdsServicesState.configuredServices)),
    exchanges: store.serviceExchangeState.exchanges,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectService: (service) => {
    dispatch(selectService(service));
  },
  toggleContext: () => {
    dispatch(setContextVisibility());
  },
  storeExchange: (url, request, response, responseStatus) => {
    dispatch(storeExchange(url, request, response, responseStatus));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ContextView);
