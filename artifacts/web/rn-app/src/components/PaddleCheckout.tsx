import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { PADDLE_CONFIG } from "../config/paddle";

interface PaddleCheckoutProps {
  email: string;
  transactionId?: string;
  priceId?: string;
  subscriptionId?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const PaddleCheckout = ({ email, transactionId, priceId, subscriptionId, onSuccess, onCancel }: PaddleCheckoutProps) => {
  const [webViewKey, setWebViewKey] = useState(0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background-color: #ffffff; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .loading-container { text-align: center; width: 80%; }
          .loading-text { font-weight: 700; color: #64748b; margin-bottom: 10px; font-size: 16px; }
          .error-text { color: #f43f5e; font-weight: 600; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="loading-container" id="status-container">
          <div class="loading-text" id="status-msg">Duke hapur dritaren e sigurt të pagesës...</div>
          <div id="error-details" class="error-text"></div>
        </div>

        <script type="text/javascript">
          window.onerror = function(msg, url, line) {
            document.getElementById('error-details').innerHTML = "Script Error: " + msg;
            return false;
          };

          // Timeout for loading
          const loadTimeout = setTimeout(() => {
            if (document.getElementById('status-msg').style.display !== 'none') {
              document.getElementById('status-msg').innerHTML = "Vonesë në ngarkim. Kontrolloni lidhjen.";
            }
          }, 15000);

          try {
            console.log('Initializing Paddle...');
            if (typeof Paddle === 'undefined') {
              throw new Error('Paddle SDK not loaded. Kontrolloni lidhjen tuaj.');
            }
            Paddle.Environment.set('${PADDLE_CONFIG.ENVIRONMENT}');
            Paddle.Initialize({
              token: '${PADDLE_CONFIG.CLIENT_TOKEN}',
              eventCallback: function(data) {
                console.log('Paddle Event:', data.name);
                if (data.name === 'checkout.completed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: data.data }));
                } else if (data.name === 'checkout.closed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                } else if (data.name === 'checkout.loaded') {
                  clearTimeout(loadTimeout);
                  document.getElementById('status-container').style.display = 'none';
                } else if (data.name === 'checkout.error') {
                   clearTimeout(loadTimeout);
                   document.getElementById('status-msg').innerHTML = 'Gabim nga Paddle API';
                   document.getElementById('error-details').innerHTML = data.data?.error?.detail || 'Ju lutem provoni përsëri.';
                }
              }
            });

            const checkoutOptions = {
              settings: {
                displayMode: 'overlay', // Using overlay but it fills the WebView container
                theme: 'light',
                locale: 'sq'
              }
            };

            if ('${transactionId || ""}') {
              checkoutOptions.transactionId = '${transactionId}';
            } else if ('${subscriptionId || ""}') {
              checkoutOptions.subscriptionId = '${subscriptionId}';
            } else {
              checkoutOptions.items = [{ priceId: '${priceId || "pri_01ky8e821v11dc6f2nf9jnq5v8"}', quantity: 1 }];
              checkoutOptions.customer = { email: '${email}' };
            }

             Paddle.Checkout.open(checkoutOptions);
          } catch (e) {
            document.getElementById('status-msg').innerHTML = 'Gabim gjatë ngarkimit.';
            document.getElementById('error-details').innerHTML = e.message;
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WebView
        key={webViewKey}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.event === 'success') onSuccess(msg.data);
            if (msg.event === 'cancel') onCancel();
          } catch (e) {
            console.warn("WebView message parse error:", e);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView={false}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }]}>
            <ActivityIndicator size="large" color="#3473ef" />
          </View>
        )}
      />
      <TouchableOpacity
        onPress={() => setWebViewKey(prev => prev + 1)}
        style={{ padding: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700' }}>RI-NGARKONI PAGESËN</Text>
      </TouchableOpacity>
    </View>
  );
};
