import React, { forwardRef, useImperativeHandle } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const GoogleLoginButton = forwardRef(({ onLoginSuccess }, ref) => {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  const clientId = Constants.expoConfig?.extra?.googleClientId || '862718498890-ckqf5hv6l5q9s8lc5oq9m2g3p5k4j7h8.apps.googleusercontent.com';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleLogin(code);
    }
  }, [response]);

  const handleGoogleLogin = async (code) => {
    try {
      // Exchange code for access token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
        },
        discovery
      );

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      const userInfo = await userInfoResponse.json();

      onLoginSuccess({
        provider: 'google',
        accessToken: tokenResponse.accessToken,
        user: userInfo,
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerLogin: () => {
      promptAsync();
    },
  }));

  return null; // This component doesn't render anything visible
});

export default GoogleLoginButton; 