import Link from "next/link";
import React from "react";
import { Icon, Text } from "@bonterratech/stitch-extension";
import { EXTERNAL_URLS } from "../constants";

interface FooterProps {
  showHelp?: boolean;
}

const Footer = ({ showHelp = false }: FooterProps) => {
  return (
    <>
      <Text>© 2025 Bonterra</Text>
      <Link target="_blank" href={EXTERNAL_URLS.TERMS_OF_SERVICE}>
        Terms of Service&nbsp;&nbsp;
        <Icon name="arrow-up-right-from-square" color="link" size="x-small" />
      </Link>
      <Link target="_blank" href={EXTERNAL_URLS.PRIVACY_POLICY}>
        Privacy Policy&nbsp;&nbsp;
        <Icon name="arrow-up-right-from-square" color="link" size="x-small" />
      </Link>
      {showHelp && (
        <Link target="_blank" href={EXTERNAL_URLS.SUPPORT}>
          Support&nbsp;&nbsp;
          <Icon name="arrow-up-right-from-square" color="link" size="x-small" />
        </Link>
      )}
    </>
  );
};

export default Footer;
