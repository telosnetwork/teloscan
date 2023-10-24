/* eslint-disable @typescript-eslint/no-var-requires */
import { boot } from 'quasar/wrappers';
import { Dialog, Notify } from 'quasar';

// to persist the notification and require user to dismiss pass `true` as second param
const errorNotification = function(error, dismiss = false) {
    let errorStr;
    if (error !== undefined) {
        if (typeof error.startsWith !== 'function') {
            errorStr = error;
        } else if (error.startsWith('assertion failure with message:')) {
            errorStr = error.split('assertion failure with message:')[1];
        } else {
            errorStr = error;
        }
    } else {
        errorStr = 'Cancelled transaction';
    }

    Notify.create({
        color: 'negative',
        icon: 'error',
        timeout: dismiss ? 0 : 5000,
        message: `${errorStr}`,
        actions: dismiss ? [
            { label: this.$t('notification.dismiss_label'), color: 'white' },
        ] : [],
    });
};

const unexpectedErrorNotification = function(error) {
    Notify.create({
        color: 'dark',
        icon: 'warning',
        message: `${error}`,
    });
};

const warningNotification = function(warning) {
    Notify.create({
        color: 'warning',
        icon: 'warning',
        message: warning,
    });
};

const successNotification = function(message) {
    Notify.create({
        color: 'primary',
        icon: 'done',
        message: `${message}`,
    });
};

// ---------- new notification layouts ---------------

class NotificationAction {
    constructor(payload) {
        this.label     = payload.label;
        this.class     = payload.class;
        this.handler   = payload.handler;
        this.iconRight = payload.iconRight;
        this.color     = payload.color;
    }
}

const crossIcon = require('src/assets/icon--cross.svg');
const checkIcon = require('src/assets/icon--check.svg');
const discoIcon = require('src/assets/icon--disconnected.svg');

const html = `
    <div class="c-notify__container c-notify__container--{type} c-notify__container--{random}">
        <div class="c-notify__header"></div>
        <div class="c-notify__title">
            <img src='{svg}' class="c-notify__icon" />
            <span>{title}</span>
        </div>
        <div class="c-notify__message">
            <span>{message}</span>
        </div>
    </div>
`;

const notifyMessage = function(type, icon, title, message, payload) {

    // action buttons
    const actions = [];
    const dismiss_btn = {
        label: this.$t('notification.dismiss_label'),
        class: 'c-notify__action-btn',
    };
    const link_btn = {
        label: this.$t('notification.success_see_trx_label'),
        color: 'positive',
        iconRight: 'launch',
        class: 'c-notify__action-btn',
        handler: () => {
            window.open(payload, '_blank');
        },
    };
    const details_btn = {
        label: this.$t('notification.error_see_details_label'),
        class: 'c-notify__action-btn ',
        handler: () => {
            let content = '';
            // We try to parse the payload to obtain a content string
            try {
                // First we try to parse the payload as JSON
                content = JSON.stringify(payload, null, 2);
            } catch (e) {
                // If it fails, we discard the error and try to executes toString() from the payload
                try {
                    content = payload.toString();
                } catch (e) {
                    // If it fails, likely the payload is null (or some unknown object with no toString function),
                    // so we set the content to a forced string to have something to show
                    content = payload + ' ';
                }
            }

            Dialog.create({
                class: 'c-notify__dialog',
                title: this.$t('notification.error_details_title'),
                message: '<q-card-section>' + content + '</q-card-section>',
                html: true,
            });
        },
    };
    const action_btn = {
        label: this.$t(payload?.label ?? '') ?? this.$t('notification.error_see_details_label'),
        color: payload?.color ?? type === 'error' ? 'negative' : 'positive',
        iconRight: payload?.iconRight,
        class: 'c-notify__action-btn ' + payload?.class ? payload?.class : '',
        handler: payload?.handler,
    };
    const hidden_btn = {
        label: 'hidden',
        class: 'c-notify__action-btn c-notify__action-btn--hide',
    };

    // adding buttons
    if (typeof payload === 'string' && type === 'success') {
        actions.push(link_btn);
    } else if (typeof payload === 'object' && payload instanceof NotificationAction) {
        actions.push(action_btn);
    } else if (typeof payload === 'object' && type === 'error') {
        actions.push(details_btn);
    } else {
        actions.push(hidden_btn);
    }
    actions.push(dismiss_btn);
    if (type === 'neutral') {
        // if neutral, no buttons
        actions.splice(0, actions.length);
    }

    let final_message = this.$t(message ?? '');
    if (Array.isArray(message)) {
        final_message = message.map(
            m => ` <${m.tag ?? 'span'} class="${m.class}">${m.text}</${m.tag ?? 'span'}> `,
        ).join('');
    }

    let timeout = 0;
    // let timeout = 4000; // FIXME: uncomment this line to enable auto-dismiss
    if (type === 'error') {
        timeout = 0;
    }

    let position = 'bottom';
    if (type === 'neutral') {
        position = 'bottom-right';
    }

    let random = Math.floor(Math.random() * 1000000);

    return Notify.create({
        timeout,
        position,
        message: html
            .replace('{svg}', icon)
            .replace('{type}', type)
            .replace('{title}', title)
            .replace('{random}', random)
            .replace('{message}', final_message),
        html: true,
        classes: 'c-notify',
        actions,
    });
};

const notifySuccessTransaction = function(link) {
    return notifyMessage.bind(this)(
        'success',
        checkIcon,
        this.$t('notification.success_title_trx').toUpperCase(),
        this.$t('notification.success_message_trx'),
        link,
    );
};

const notifySuccessMessage = function(message, payload) {
    return notifyMessage.bind(this)(
        'success',
        checkIcon,
        this.$t('notification.success_title_trx').toUpperCase(),
        message,
        payload,
    );
};

const notifySuccessCopy = function() {
    return notifyMessage.bind(this)(
        'success',
        checkIcon,
        this.$t('notification.success_title_copied').toUpperCase(),
        this.$t('notification.success_message_copied'),
    );
};

const notifyFailure = function(message, payload) {
    return notifyMessage.bind(this)(
        'error',
        crossIcon,
        this.$t('notification.error_title').toUpperCase(),
        message,
        payload,
    );
};

const notifyFailureWithAction = function(message, payload) {
    return notifyMessage.bind(this)(
        'error',
        crossIcon,
        this.$t('notification.error_title').toUpperCase(),
        message,
        new NotificationAction(payload),
    );
};

const notifyDisconnected = function() {
    return notifyMessage.bind(this)(
        'error',
        discoIcon,
        this.$t('notification.error_title_disconnect'),
        this.$t('notification.error_message_disconnect'),
    );
};

const notifyNeutralMessage = function(message) {
    return notifyMessage.bind(this)(
        'neutral',
        null,
        null,
        message,
    );
};

export default boot(({ app, store }) => {
    app.config.globalProperties.$errorNotification           = errorNotification.bind(store);
    app.config.globalProperties.$unexpectedErrorNotification = unexpectedErrorNotification.bind(store);
    app.config.globalProperties.$warningNotification         = warningNotification.bind(store);
    app.config.globalProperties.$successNotification         = successNotification.bind(store);
    store['$errorNotification']                              = app.config.globalProperties.$errorNotification;
    store['$unexpectedErrorNotification']                    = app.config.globalProperties.$unexpectedErrorNotification;
    store['$warningNotification']                            = app.config.globalProperties.$warningNotification;
    store['$successNotification']                            = app.config.globalProperties.$successNotification;

    // new Message notifications handlers
    app.config.globalProperties.$notifySuccessTransaction = notifySuccessTransaction.bind(store);
    app.config.globalProperties.$notifySuccessMessage     = notifySuccessMessage.bind(store);
    app.config.globalProperties.$notifySuccessCopy        = notifySuccessCopy.bind(store);
    app.config.globalProperties.$notifyFailure            = notifyFailure.bind(store);
    app.config.globalProperties.$notifyFailureWithAction  = notifyFailureWithAction.bind(store);
    app.config.globalProperties.$notifyDisconnected       = notifyDisconnected.bind(store);
    app.config.globalProperties.$notifyNeutralMessage     = notifyNeutralMessage.bind(store);
    store['$notifySuccessTransaction']                    = app.config.globalProperties.$notifySuccessTransaction;
    store['$notifySuccessMessage']                        = app.config.globalProperties.$notifySuccessMessage;
    store['$notifySuccessCopy']                           = app.config.globalProperties.$notifySuccessCopy;
    store['$notifyFailure']                               = app.config.globalProperties.$notifyFailure;
    store['$notifyFailureWithAction']                     = app.config.globalProperties.$notifyFailureWithAction;
    store['$notifyDisconnected']                          = app.config.globalProperties.$notifyDisconnected;
    store['$notifyNeutralMessage']                        = app.config.globalProperties.$notifyNeutralMessage;

    // transaction notifications handlers
    store['$t'] = app.config.globalProperties.$t;

});
