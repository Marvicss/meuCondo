import { Redirect } from 'expo-router'; 
import React from 'react'; 

export default function AppRootRedirect() {

  return <Redirect href="/login" />;
}