import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './services-entry.css';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';
import ServicesSelect from "../ServicesSelect/services-select";

const propTypes = {
  /**
   * Flag to determine if the modal is open
   */
  isOpen: PropTypes.bool,
  /**
   * Callback function to close the modal
   */
  closePrompt: PropTypes.func,
};

const defaultProps = {
  isOpen: false,
  closePrompt: null,
};

export class ServicesEntry extends Component {
  state = {
    // Tracks whether the modal is open
    isOpen: this.props.isOpen,
    // User input for the discovery endpoint URL
    userInput: '',
    // Whether to display an error in the Field component
    shouldDisplayError: false,
    // Error message if `shouldDisplayError` is true
    errorMessage: '',
  };

  componentDidUpdate(prevProps) {
    // If the parent component toggles `isOpen`, reset relevant state
    if (prevProps.isOpen !== this.props.isOpen) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        isOpen: this.props.isOpen,
        shouldDisplayError: false,
        errorMessage: '',
        userInput: '',
      });
    }
  }

  /**
   * Closes the modal and clears any displayed errors.
   */
  handleCloseModal = () => {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) {
      this.props.closePrompt();
    }
  };

  /**
   * Updates the local state whenever the input text changes.
   */
  handleChange = (event) => {
    this.setState({ userInput: event.value });
  };

  /**
   * Validates and sanitizes the user-input URL, attempts to retrieve discovery services,
   * and closes the modal if successful. Otherwise, displays an error message.
   */
  handleSubmit = async () => {
    const { userInput } = this.state;
    const trimmed = userInput.trim();

    if (!trimmed) {
      this.setState({
        shouldDisplayError: true,
        errorMessage: 'Enter a valid discovery endpoint',
      });
      return;
    }

    let checkUrl = trimmed;
    // Prepend "http://" if user didn't specify a protocol
    if (!/^(https?:)?\/\//i.test(checkUrl)) {
      checkUrl = `http://${checkUrl}`;
      this.setState({ userInput: checkUrl });
    }

    try {
      await retrieveDiscoveryServices(checkUrl);
      // If retrieval succeeded, close the modal
      this.handleCloseModal();
    } catch (err) {
      this.setState({
        shouldDisplayError: true,
        errorMessage: 'Failed to connect to the discovery endpoint. See console for details.',
      });
    }
  };

  render() {
    const {
      isOpen, shouldDisplayError, errorMessage,
    } = this.state;

    const header = <Text weight={700} fontSize={20}>Add CDS Services</Text>;

    const footer = (
        <div className={styles['right-align']}>
          <Button text="Save" variant="emphasis" onClick={this.handleSubmit} />
          <Spacer marginLeft="small" isInlineBlock>
            <Button text="Cancel" onClick={this.handleCloseModal} />
          </Spacer>
        </div>
    );

    return (
        <Modal
            ariaLabel="CDS Services"
            isOpen={isOpen}
            closeOnEsc
            closeOnOutsideClick
            onRequestClose={this.handleCloseModal}
            classNameModal={styles['fixed-size']}
        >
          <Dialog
              header={header}
              footer={footer}
              onClose={this.handleCloseModal}
          >
            <ServicesSelect
                formFieldLabel="Enter discovery endpoint url"
                shouldDisplayError={shouldDisplayError}
                errorMessage={errorMessage}
                placeholderText="https://example-services.com/cds-services"
                inputOnChange={this.handleChange}
                inputName="discovery-endpoint-input"
            />
            <Text isItalic>
              Note: See&nbsp;
              <a
                  href="https://cds-hooks.org/specification/current/#discovery"
                  rel="noreferrer noopener"
                  target="_blank"
              >
                documentation
              </a>
              &nbsp;for more details regarding the Discovery endpoint.
            </Text>
          </Dialog>
        </Modal>
    );
  }
}

ServicesEntry.propTypes = propTypes;
ServicesEntry.defaultProps = defaultProps;

export default ServicesEntry;
