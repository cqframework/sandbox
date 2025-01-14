import React from 'react';

import BrandFooter from 'terra-brand-footer';
import styles from './footer.css';

import cx from 'classnames';

export default () => (
    <BrandFooter
        isVertical
        sections={[
            {
                headerText: 'Documentation Links',
                links: [
                    { text: 'CDS Hooks Specification', href: 'https://cds-hooks.org', target: '_blank' },
                    { text: 'FHIR R4 Specification', href: 'http://hl7.org/fhir/R4/index.html', target: '_blank' },
                    { text: 'Sandbox Walkthrough', href: 'https://github.com/cds-hooks/sandbox/wiki/CDS-Hooks-Sandbox-Walkthrough', target: '_blank' },
                ],
            },
            {
                headerText: 'Project Links',
                links: [
                    { text: 'Github Repository', href: 'https://github.com/cds-hooks/sandbox', target: '_blank' },
                    { text: 'Report an Issue', href: 'https://github.com/cds-hooks/sandbox/issues/new', target: '_blank' },
                    { text: 'Wiki', href: 'https://github.com/cds-hooks/sandbox/wiki', target: '_blank' },
                ],
            },
        ]}
    />
);
