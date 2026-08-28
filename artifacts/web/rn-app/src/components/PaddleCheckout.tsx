import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { PADDLE_CONFIG } from "../config/paddle";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
    <html lang="sq">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, system-ui, sans-serif; }
          body {
            background-color: #ffffff;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3473ef;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          #status-msg {
            color: #64748b;
            font-weight: 800;
            font-size: 16px;
            padding: 20px;
          }
          #error-msg {
            color: #ef4444;
            font-size: 14px;
            margin-top: 10px;
            padding: 0 40px;
          }
        </style>
      </head>
      <body>
        <div id="status-container">
          <div class="loader" style="margin: 0 auto 20px auto;"></div>
          <div id="status-msg">Duke hapur sistemin e pagesave...</div>
          <div id="error-msg"></div>
        </div>

        <div id="checkout-container" style="width: 100%;"></div>

        <script type="text/javascript">
          function logToRN(msg) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'log', message: msg }));
            }
          }

          window.onerror = function(message, source, lineno, colno, error) {
            const err = message + " at " + lineno + ":" + colno;
            logToRN("JS ERROR: " + err);
            document.getElementById('error-msg').innerHTML = "Script Error: " + err;
            return true;
          };

          function init() {
            try {
              if (typeof Paddle === 'undefined') {
                logToRN("Paddle SDK not found yet, retrying in 1s...");
                setTimeout(init, 1000);
                return;
              }

              logToRN("Paddle SDK Ready. Initializing with token: " + '${PADDLE_CONFIG.CLIENT_TOKEN}');

              Paddle.Environment.set('${PADDLE_CONFIG.ENVIRONMENT}');
              Paddle.Initialize({
                token: '${PADDLE_CONFIG.CLIENT_TOKEN}',
                eventCallback: function(data) {
                  logToRN("Paddle Event: " + data.name);
                  if (data.name === 'checkout.loaded') {
                    document.getElementById('status-container').style.display = 'none';
                  }
                  if (data.name === 'checkout.completed') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: data.data }));
                  }
                  if (data.name === 'checkout.closed') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                  }
                  if (data.name === 'checkout.error') {
                     logToRN("Paddle API Error: " + JSON.stringify(data.data));
                     document.getElementById('error-msg').innerHTML = "Paddle Error: " + (data.data?.error?.detail || "Gabim në procesim.");
                  }
                }
              });

              const options = {
                settings: {
                  displayMode: 'inline',
                  frameTarget: 'checkout-container',
                  frameInitialHeight: 450,
                  frameStyle: 'width: 100%; min-height: 450px; background: transparent; border: none;',
                  theme: 'light',
                  locale: 'sq'
                },
                customer: { email: '${email}' }
              };

              const txId = '${transactionId || ""}';
              const pId = '${priceId || "pri_01ky8e821v11dc6f2nf9jnq5v8"}';
              const subId = '${subscriptionId || ""}';

              if (subId && subId !== 'undefined' && subId !== '') {
                logToRN("Opening card update for Subscription ID: " + subId);
                Paddle.Checkout.open({
                  settings: options.settings,
                  subscriptionId: subId
                });
              } else {
                if (txId && txId !== 'undefined' && txId !== '') {
                  options.transactionId = txId;
                  logToRN("Opening checkout with Transaction ID: " + txId);
                } else {
                  options.items = [{ priceId: pId, quantity: 1 }];
                  logToRN("Opening checkout with Price ID: " + pId);
                }
                Paddle.Checkout.open(options);
              }
            } catch (e) {
              logToRN("Init Exception: " + e.message);
              document.getElementById('error-msg').innerHTML = "Init Error: " + e.message;
            }
          }

          setTimeout(init, 300);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, minHeight: 480, width: '100%', backgroundColor: 'white' }}>
      <WebView
        key={webViewKey}
        source={{ html }}
        style={{ flex: 1, minHeight: 450, width: '100%' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.event === 'success') onSuccess(msg.data);
            if (msg.event === 'cancel') onCancel();
            if (msg.event === 'log') console.log('[Paddle Checkout]', msg.message);
          } catch (e) {}
        }}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }]}>
            <ActivityIndicator size="large" color="#3473ef" />
          </View>
        )}
      />
      <TouchableOpacity
        onPress={() => setWebViewKey(prev => prev + 1)}
        style={{ padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '800' }}>RI-NGARKONI PAGESËN</Text>
      </TouchableOpacity>
    </View>
  );
};
