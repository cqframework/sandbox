import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';

import medListCache from "../../retrieve-data-helpers/med-list-cache";

// import styles from './lazy-med-search-select.css';

function LazyMedSearchSelect({ onChange }) {
    const [selectedOption, setSelectedOption] = useState(null);

    // This function filters the data set based on the user's search term.
    // React-Select expects a function that either returns a Promise
    // or accepts a callback. We'll return a Promise for simplicity.
    const loadOptions = (inputValue) => {
        return new Promise((resolve) => {
            // If the user hasn't typed anything, return an empty array
            if (!inputValue) {
                return resolve([]);
            }

            // Convert input to lower case for case-insensitive matching
            const searchTerm = inputValue.toLowerCase();

            // Filter our large data set by label
            const filtered = medListCache.filter(item =>
                item.label.toLowerCase().includes(searchTerm)
            );

            resolve(filtered);
        });
    };

    // Internal change handler that calls the prop function
    const handleChange = (option) => {
        setSelectedOption(option);
        // Call the function passed in from the parent
        if (onChange) {
            onChange(option);
        }
    };

    return (
        <AsyncSelect
            // Turn off default options to avoid loading anything on initial focus
            defaultOptions={false}
            // Cache search results so the same query isn't fetched repeatedly
            cacheOptions
            loadOptions={loadOptions}
            onChange={handleChange}
            value={selectedOption}
            placeholder="Type to search..."
            isClearable
        />
    );
}

export default LazyMedSearchSelect;
