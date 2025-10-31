import React, { forwardRef, useImperativeHandle } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const FacebookLoginButton = forwardRef(({ onLoginSuccess }, ref) => {
  const clientId = Constants.expoConfig?.extra?.facebookAppId || 'YOUR_FACEBOOK_APP_ID';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    },
    {
      authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
    }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      handleFacebookLogin(access_token);
    }
  }, [response]);

  const handleFacebookLogin = async (accessToken) => {
    try {
      // Get user info from Facebook
      const userInfoResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
      const userInfo = await userInfoResponse.json();

      onLoginSuccess({
        provider: 'facebook',
        accessToken,
        user: userInfo,
      });
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerLogin: () => {
      promptAsync();
    },
  }));

  return null; // This component doesn't render anything visible
});

export default FacebookLoginButton; 