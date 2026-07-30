import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { PADDLE_CONFIG } from "../config/paddle";

interface PaddleCheckoutProps {
  email: string;
  transactionId?: string;
  priceId?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const PaddleCheckout = ({ email, transactionId, priceId, onSuccess, onCancel }: PaddleCheckoutProps) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background-color: #ffffff; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #161719; }
          .loading { text-align: center; font-weight: 700; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="loading" id="status-msg">Duke hapur dritaren e sigurt të pagesës...</div>

        <script type="text/javascript">
          try {
            Paddle.Environment.set('${PADDLE_CONFIG.ENVIRONMENT}');
            Paddle.Initialize({
              token: '${PADDLE_CONFIG.CLIENT_TOKEN}',
              eventCallback: function(data) {
                console.log('Paddle Event:', data.name);
                if (data.name === 'checkout.completed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: data.data }));
                } else if (data.name === 'checkout.closed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                }
              }
            });

            const checkoutOptions = {
              settings: {
                displayMode: 'overlay',
                variant: 'one-page',
                theme: 'light',
                allowLogout: false,
                locale: 'sq'
              }
            };

            if ('${transactionId || ""}') {
              checkoutOptions.transactionId = '${transactionId}';
            } else {
              checkoutOptions.items = [{ priceId: '${priceId || "pri_01ky8e821v11dc6f2nf9jnq5v8"}', quantity: 1 }];
              checkoutOptions.customer = { email: '${email}' };
            }

             Paddle.Checkout.open(checkoutOptions);
          } catch (e) {
            document.getElementById('status-msg').innerHTML = 'Gabim gjatë ngarkimit të Paddle. Kontrolloni lidhjen.';
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.event === 'success') onSuccess(msg);
            if (msg.event === 'cancel') onCancel();
          } catch (e) {
            onSuccess({});
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }]}>
            <ActivityIndicator size="large" color="#3473ef" />
          </View>
        )}
      />
    </View>
  );
};
