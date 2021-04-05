/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import { makeLayout, render as clientRender } from 'calypso/controller/index.web';
import * as controller from './controller';

/**
 * Style dependencies
 */
import './style.scss';

export default function () {
	page( `/partner-portal/partner-key`, controller.partnerKeyContext, makeLayout, clientRender );

	page(
		`/partner-portal/licenses/:filter(unassigned|assigned|revoked)?`,
		controller.requirePartnerKeyContext,
		controller.partnerPortalContext,
		makeLayout,
		clientRender
	);

	page(
		`/partner-portal/issue-license`,
		controller.requirePartnerKeyContext,
		controller.issueLicenseContext,
		makeLayout,
		clientRender
	);

	page( `/partner-portal/licenses/*`, '/partner-portal/licenses' );

	page(
		`/partner-portal`,
		controller.requirePartnerKeyContext,
		controller.billingDashboardContext,
		makeLayout,
		clientRender
	);
}
