import React, { useEffect, useRef } from 'react';
import { Payments } from '@square/web-sdk';

const SquareWebPaymentsForm = ({ onPaymentSuccess }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        const initializePayment = async () => {
            const payments = Payments(process.env.REACT_APP_SQUARE_APPLICATION_ID);
            const card = await payments.card();
            await card.attach(cardRef.current);

            document.getElementById('pay-button').addEventListener('click', async () => {
                const result = await card.tokenize();
                if (result.status === 'OK') {
                    onPaymentSuccess(result.token);
                } else {
                    console.error(result.errors);
                }
            });
        };

        initializePayment();
    }, [onPaymentSuccess]);

    return (
        <div>
            <div ref={cardRef}></div>
            <button id="pay-button">Pay Now</button>
        </div>
    );
};

export default SquareWebPaymentsForm;
