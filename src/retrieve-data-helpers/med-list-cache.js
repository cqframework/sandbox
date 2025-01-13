// cachedMeds.js
import rxnorm from '../assets/medication-list';

// Immediately compute meds array and export it
const medsCache = (() => {
    const meds = [];
    const obj = rxnorm.componentSetsToPrescribables;

    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            const rxcui = obj[key];
            if (Array.isArray(rxcui)) {
                for (let i = 0; i < rxcui.length; i++) {
                    meds.push({
                        value: rxcui[i],
                        label: rxnorm.cuiToName[rxcui[i]]
                    });
                }
            } else {
                meds.push({
                    value: rxcui,
                    label: rxnorm.cuiToName[rxcui]
                });
            }
        }
    }
    console.log(meds);
    return meds;
})();

export default medsCache;
