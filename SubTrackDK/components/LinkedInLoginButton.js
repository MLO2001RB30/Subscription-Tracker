import React, { forwardRef, useImperativeHandle } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const LinkedInLoginButton = forwardRef(({ onLoginSuccess }, ref) => {
  const clientId = Constants.expoConfig?.extra?.linkedinClientId || 'YOUR_LINKEDIN_CLIENT_ID';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['r_liteprofile', 'r_emailaddress'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    },
    {
      authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleLinkedInLogin(code);
    }
  }, [response]);

  const handleLinkedInLogin = async (code) => {
    try {
      onLoginSuccess({
        provider: 'linkedin',
        code,
        user: null, // LinkedIn requires backend processing
      });
    } catch (error) {
      console.error('LinkedIn login error:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerLogin: () => {
      promptAsync();
    },
  }));

  return null; // This component doesn't render anything visible
});

export default LinkedInLoginButton; 