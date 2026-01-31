import React, { useMemo } from 'react'

const useJoditConfig = () => {
    const options = ['font', 'fontsize', 'bold', 'italic', 'underline', 'link', 'ul', 'ol', 'align'];
    const config = useMemo(
        () => ({
            readonly: false,
            placeholder: 'Start typing...',
            defaultActionOnPaste: 'insert_as_html',
            askBeforePasteHTML: false,
            askBeforePasteFromWord: false,
            defaultLineHeight: 1.3,
            enter: 'P',
            cleanHTML: {
                fillEmptyParagraph: false
            },
            // options that we defined in above step.
            buttons: options,
            buttonsMD: options,
            buttonsSM: options,
            buttonsXS: options,
            statusbar: false,
            sizeLG: 900,
            sizeMD: 700,
            sizeSM: 400,
            toolbarAdaptive: false,
        }),
        [],
    );
    return config
}

export default useJoditConfig