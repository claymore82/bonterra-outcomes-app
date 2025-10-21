'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import {
  BannerContainer,
  Divider,
  EndContainer,
  GridContainer,
  MainContainer,
  PageFooter,
  PageHeader,
  PageLayoutProvider,
  ResponsiveWrapper,
  SideNavButton,
  StartContainer,
  InlineStack,
  Text,
} from '@bonterratech/stitch-extension';
import { coreTokens as $ } from '@bonterratech/stitch-tokens/coreTokens.stylex';
import Footer from './Footer';
import SideNav from './SideNav';
import type { StyleXStyles } from '@stylexjs/stylex';

export interface PageLayoutProps {
  pageTitle?: string;
  children: React.ReactNode;
  noSideNav?: boolean;
  mainContainerStyles?: StyleXStyles;
}

export const styles = stylex.create({
  headerResponsiveContainer: {
    height: $['--s-size-500'],
  },
  headerContentWrapper: {
    padding: `${$['--s-space-100']} ${$['--s-space-300']}`,
  },
  noSideNav: {
    gridTemplateAreas: `
      "page-header page-header"
      "grid-container grid-container"
    `,
  },
  noSideNavGridContainer: {
    gridTemplateColumns: 'initial',
  },
});

export default function PageLayout({
  children,
  noSideNav,
  mainContainerStyles,
  pageTitle,
}: PageLayoutProps) {
  return (
    <PageLayoutProvider
      stitches={noSideNav && styles.noSideNav}
      sideNavVisibilityBreakpoint={1024}
    >
      <PageHeader>
        <BannerContainer />
        <StartContainer>
          <InlineStack verticalAlign="center" fullHeight={true} gap="300">
            {noSideNav ? null : <SideNavButton />}
            <Link href="/">
              <InlineStack verticalAlign="center" fullHeight={true} gap="300">
                <Image
                  alt="Bonterra"
                  height={32}
                  src="https://stitch-public-assets.s3.us-east-1.amazonaws.com/Bonterra-logomark_indigo.svg"
                  width={32}
                />
                <ResponsiveWrapper stitches={styles.headerResponsiveContainer}>
                  <Divider orientation="vertical" />
                </ResponsiveWrapper>
                <ResponsiveWrapper hideBelow="md">
                  <Text variant="lg" weight="500" whitespace="nowrap">
                    {pageTitle || 'Bonstart'}
                  </Text>
                </ResponsiveWrapper>
              </InlineStack>
            </Link>
          </InlineStack>
        </StartContainer>
        <EndContainer />
      </PageHeader>
      <>
        {!noSideNav && <SideNav />}
        <GridContainer stitches={noSideNav && styles.noSideNavGridContainer}>
          <MainContainer stitches={mainContainerStyles}>
            {children}
          </MainContainer>
          <PageFooter>
            <Footer />
          </PageFooter>
        </GridContainer>
      </>
    </PageLayoutProvider>
  );
}
