import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './fhir-server-entry.css';
import FhirServerSelect from '../FhirServerSelect/fhir-server-select';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';

const propTypes = {
  currentFhirServer: PropTypes.string.isRequired,
  defaultFhirServer: PropTypes.string.isRequired,
  isEntryRequired: PropTypes.bool,
  isOpen: PropTypes.bool,
  resolve: PropTypes.func,
  closePrompt: PropTypes.func,
  // If there's an initial error that should display on first render
  initialError: PropTypes.string,
};

const defaultProps = {
  isEntryRequired: false,
  isOpen: false,
  resolve: null,
  closePrompt: null,
  initialError: '',
};

export class FhirServerEntry extends Component {
  state = {
    // Tracks whether the modal is open
    isOpen: Boolean(this.props.isOpen),
    // Text from the user input field
    userInput: '',
    // If the input is invalid, show an error
    shouldDisplayError: Boolean(this.props.initialError),
    // Error message to show when shouldDisplayError is true
    errorMessage: this.props.initialError || '',
  };

  componentDidUpdate(prevProps) {
    // If the parent changes isOpen, update state accordingly
    if (prevProps.isOpen !== this.props.isOpen) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        isOpen: Boolean(this.props.isOpen),
        shouldDisplayError: false,
        errorMessage: '',
      });
    }
  }

  /**
   * Closes the modal and resets any error state.
   */
  handleCloseModal = () => {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    this.props.closePrompt?.();
  };

  /**
   * Updates state with the latest user input from the text field.
   */
  handleChange = (event) => {
    this.setState({ userInput: event.value });
  };

  /**
   * When a user clicks "Reset to default FHIR server," fetch metadata from the default server,
   * call `resolve` if provided, then close the modal.
   */
  handleResetDefaultServer = async () => {
    await retrieveFhirMetadata(this.props.defaultFhirServer);
    this.props.resolve?.();
    this.handleCloseModal();
  };

  /**
   * Validates user input, attempts to retrieve metadata from the entered FHIR server.
   * If successful, resolves (if required) and closes. Otherwise, displays an error message.
   */
  handleSubmit = async () => {
    const { userInput } = this.state;
    const trimmedInput = userInput.trim();

    if (!trimmedInput) {
      this.setState({
        shouldDisplayError: true,
        errorMessage: 'Enter a valid FHIR server base URL',
      });
      return;
    }

    // Auto-prepend "http://" if the user didn't specify a protocol
    let checkUrl = trimmedInput;
    if (!/^(https?:)?\/\//i.test(checkUrl)) {
      checkUrl = `http://${checkUrl}`;
      this.setState({ userInput: checkUrl });
    }

    try {
      await retrieveFhirMetadata(checkUrl);
      // If we get here with no error, retrieval was successful
      this.props.resolve?.();
      this.handleCloseModal();
    } catch (err) {
      if (err?.response?.status === 401) {
        // Secured endpoints aren't supported
        this.setState({
          shouldDisplayError: true,
          errorMessage: 'Cannot configure secured FHIR endpoints. Please use an open (unsecured) FHIR endpoint.',
        });
      } else {
        this.setState({
          shouldDisplayError: true,
          errorMessage: 'Failed to connect to the FHIR server. See console for details.',
        });
      }
    }
  };

  render() {
    const { isEntryRequired, currentFhirServer } = this.props;
    const {
      isOpen,
      shouldDisplayError,
      errorMessage,
      userInput,
    } = this.state;

    const header = <Text weight={700} fontSize={20}>Change FHIR Server</Text>;

    const footer = (
        <div className={styles['right-align']}>
          {!isEntryRequired && (
              <div className={styles['left-aligned-text']}>
                <Button
                    text="Reset to default FHIR server"
                    variant="de-emphasis"
                    onClick={this.handleResetDefaultServer}
                />
              </div>
          )}

          <Button text="Next" variant="emphasis" onClick={this.handleSubmit} />

          {!isEntryRequired && (
              <Spacer marginLeft="small" isInlineBlock>
                <Button text="Cancel" onClick={this.handleCloseModal} />
              </Spacer>
          )}
        </div>
    );

    return (
        <Modal
            ariaLabel="FHIR Server"
            isOpen={isOpen}
            closeOnEsc={!isEntryRequired}
            closeOnOutsideClick={!isEntryRequired}
            onRequestClose={this.handleCloseModal}
            classNameModal={styles['fixed-size']}
        >
          <Dialog
              header={header}
              footer={footer}
              onClose={isEntryRequired ? null : this.handleCloseModal}
          >
            <FhirServerSelect
                currentFhirServer={currentFhirServer}
                formFieldLabel="Enter a FHIR Server URL"
                shouldDisplayError={shouldDisplayError}
                errorMessage={errorMessage}
                placeholderText={currentFhirServer}
                inputOnChange={this.handleChange}
                inputName="fhir-server-input"
            />
          </Dialog>
        </Modal>
    );
  }
}

FhirServerEntry.propTypes = propTypes;
FhirServerEntry.defaultProps = defaultProps;

const mapStateToProps = (store) => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  defaultFhirServer: store.fhirServerState.defaultFhirServer,
});

export default connect(mapStateToProps)(FhirServerEntry);
