import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Card from 'terra-card';
import Heading from 'terra-heading';
import Toggle from 'terra-toggle/lib/Toggle';
import IconChevronRight from 'terra-icon/lib/icon/IconChevronRight';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';

import styles from './exchange-panel.css';

const propTypes = {
  /**
   * Flag to determine if the exchange panel is collapsed or expanded
   */
  isExpanded: PropTypes.bool.isRequired,
  /**
   * Text to display in the exchange panel body (i.e. JSON-stringified request or response from CDS service)
   */
  panelText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  /**
   * Text to display in the exchange panel header
   */
  panelHeader: PropTypes.string.isRequired,
};

const ExchangePanel = ({ isExpanded, panelText, panelHeader }) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  // Convert panelText to an array of lines, memoized for performance
  const textLines = useMemo(() => {
    if (!panelText) return [];
    const jsonString = typeof panelText === 'object'
        ? JSON.stringify(panelText, null, 2)
        : panelText;
    return jsonString.split(/\n/);
  }, [panelText]);

  const iconToggle = expanded ? <IconChevronDown /> : <IconChevronRight />;

  return (
      <Card>
        <Heading
            className={styles['header-toggle']}
            level={1}
            size="medium"
            weight={700}
            onClick={handleToggle}
        >
          {iconToggle}
          {panelHeader}
        </Heading>
        <Toggle isOpen={expanded} isAnimated>
          <Card.Body>
            <div className={cx(styles['fhir-view'], styles['panel-text'], styles['panel-height'])}>
            <pre>
              {textLines.map((line, index) => (
                  <div key={`${line}-${index}`}>{line}</div>
              ))}
            </pre>
            </div>
          </Card.Body>
        </Toggle>
      </Card>
  );
};

ExchangePanel.propTypes = propTypes;

export default ExchangePanel;
