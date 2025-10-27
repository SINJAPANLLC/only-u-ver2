import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const EmailVerificationNotice = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
            <div className="text-center max-w-md">
                <h1 className="text-xl font-bold mb-6">
                    <Trans i18nKey="emailVerification.title">
                        {t('emailVerify.title')} <br />{t('emailVerify.afterBr')}
                    </Trans>
                </h1>

                <p className="mb-4">{t('emailVerification.sentInfo')}</p>

                <p className="mb-4">{t('emailVerification.cooperation')}</p>

                <p className="mb-4">
                    <Trans i18nKey="emailVerification.notReceived" components={{ a: <a href="#" className="text-red-600 underline" /> }} />
                </p>

                <p className="mb-4">{t('emailVerification.spamSettings')}</p>

                <p className="mb-4">
                    <Trans
                        i18nKey="emailVerification.fromAddress"
                        components={{ strong: <strong /> }}
                    />
                </p>

                <p className="mb-4">
                    <Trans i18nKey="emailVerification.moreInfo" components={{ a: <a href="#" className="text-red-600 underline" /> }} />
                </p>

                <a href="#" className="inline-block mb-6 text-sm text-red-600 underline">
                    {t('emailVerification.backToCreation')}
                </a>

                <div className="flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c.71 0 1.44.15 2.06.42a2 2 0 11-3.24 0c.62-.27 1.35-.42 2.06-.42zM15 11V7a3 3 0 10-6 0v4a3 3 0 002.977 2.941A3 3 0 0015 11z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v7a3 3 0 003 3h6a3 3 0 003-3v-7" />
                    </svg>
                    <span className="text-pink-600 font-bold text-3xl ml-2" style={{ fontFamily: 'poppins, sans-serif' }}>
                        {t('emailVerification.brand')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationNotice;
