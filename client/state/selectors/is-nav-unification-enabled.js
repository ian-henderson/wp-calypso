/**
 * External dependencies
 */
import cookie from 'cookie';

/**
 * Internal dependencies
 */
import { isAutomatticTeamMember } from 'calypso/reader/lib/teams';
import { getReaderTeams } from 'calypso/state/teams/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import isAtomicSite from 'calypso/state/selectors/is-site-automated-transfer';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import isNavUnificationNewUser from 'calypso/state/selectors/is-nav-unification-new-user';

// Gradual rollout (segment of existing users + all new users registered after March 5, 2021).
const CURRENT_ROLLOUT_SEGMENT_PERCENTAGE = 100;

export default ( state ) => {
	const hasDocument = 'undefined' !== typeof document;

	// Disable if explicitly requested by the `?disable-nav-unification` query param.
	if ( hasDocument && new URL( document.location ).searchParams.has( 'disable-nav-unification' ) ) {
		return false;
	}

	// Disabled for Jetpack sites.
	const siteId = getSelectedSiteId( state );
	if ( isJetpackSite( state, siteId ) && ! isAtomicSite( state, siteId ) ) {
		return false;
	}

	const userId = getCurrentUserId( state );

	// Users belonging to the current segment OR New Users.
	const userInCurrentRolloutSegment = userId % 100 < CURRENT_ROLLOUT_SEGMENT_PERCENTAGE;
	if ( userInCurrentRolloutSegment || isNavUnificationNewUser( state ) ) {
		return true;
	}

	// Enable nav-unification for all a12s.
	if ( isAutomatticTeamMember( getReaderTeams( state ) ) ) {
		return true;
	}

	// By this point we're checking the cookies which can't be done on the server.
	if ( ! hasDocument ) {
		return false;
	}

	// Enable for E2E tests checking Nav Unification.
	// @see https://github.com/Automattic/wp-calypso/pull/50144.
	const cookies = cookie.parse( document.cookie );
	if ( cookies.flags && cookies.flags.includes( 'nav-unification' ) ) {
		return true;
	}

	// Disabled by default.
	return false;
};
