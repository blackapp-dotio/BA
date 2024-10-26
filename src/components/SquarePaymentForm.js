// squarePaymentForm.js

let squareInitialized = false; // Global flag to ensure initialization happens once
let cardInstance = null; // Store the card instance

export const initializeSquarePaymentForm = async (applicationId, locationId, containerRef) => {
  if (squareInitialized && cardInstance) {
    console.log('Square Payment Form already initialized.');
    return cardInstance; // Return the existing card instance
  }

  return new Promise(async (resolve, reject) => {
    try {
      if (!window.Square) {
        const script = document.createElement('script');
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.async = true;
        script.onload = async () => {
          console.log('Square SDK loaded successfully');
          const payments = window.Square.payments(applicationId, locationId);
          cardInstance = await payments.card();
          squareInitialized = true; // Mark initialization as complete
          await cardInstance.attach(containerRef); // Attach form to container
          resolve(cardInstance);
        };
        script.onerror = () => reject(new Error('Failed to load Square SDK'));
        document.body.appendChild(script);
      } else {
        console.log('Square SDK already loaded');
        const payments = window.Square.payments(applicationId, locationId);
        cardInstance = await payments.card();
        squareInitialized = true; // Mark initialization as complete
        await cardInstance.attach(containerRef); // Attach form to container
        resolve(cardInstance);
      }
    } catch (error) {
      console.error('Error initializing Square Payment Form:', error);
      reject(error);
    }
  });
};
