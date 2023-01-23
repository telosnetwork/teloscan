// compilation of fallthrough attributes from https://quasar.dev/vue-components/input
export const quasarInputProps = {
    name: {
        type: String,
        required: true,
    },
    mask: {
        type: String,
        default: undefined,
    },
    ['fill-mask']: {
        type: [Boolean, String],
        default: false,
    },
    ['reverse-fill-mask']: {
        type: Boolean,
        default: false,
    },
    ['unmasked-value']: {
        type: Boolean,
        default: false,
    },
    error: {
        type: Boolean,
        default: false,
    },
    rules: {
        type: Array,
        default: undefined,
    },
    ['reactive-rules']: {
        type: Boolean,
        default: false,
    },
    ['lazy-rules']: {
        type: [Boolean, String],
        default: true,
        validator: rule => [true, false, 'ondemand'].includes(rule),
    },
    loading: {
        type: Boolean,
        default: false,
    },
    clearable: {
        type: Boolean,
        default: false,
    },
    autofocus: {
        type: Boolean,
        default: false,
    },
    for: {
        type: String,
        default: '',
    },
    ['error-message']: {
        type: String,
        default: '',
    },
    ['no-error-icon']: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        required: true,
    },
    ['stack-label']: {
        type: Boolean,
        default: false,
    },
    hint: {
        type: String,
        default: '',
    },
    ['hide-hint']: {
        type: Boolean,
        default: false,
    },
    prefix: {
        type: String,
        default: '',
    },
    suffix: {
        type: String,
        default: '',
    },
    ['clear-icon']: {
        type: String,
        default: '',
    },
    ['label-slot']: {
        type: Boolean,
        default: false,
    },
    ['bottom-slots']: {
        type: Boolean,
        default: false,
    },
    counter: {
        type: Boolean,
        default: false,
    },
    ['shadow-text']: {
        type: String,
        default: '',
    },
    autogrow: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: 'text',
        validator: type => [
            'text',
            'password',
            'textarea',
            'email',
            'search',
            'tel',
            'file',
            'number',
            'url',
            'time',
            'date',
        ].includes(type),
    },
    debounce: {
        type: [String, Number],
        default: '',
    },
    maxlength: {
        type: [String, Number],
        default: '',
    },
    disable: {
        type: Boolean,
        default: false,
    },
    readonly: {
        type: Boolean,
        default: false,
    },
};
