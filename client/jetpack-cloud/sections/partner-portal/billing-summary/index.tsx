/**
 * External dependencies
 */
import React, { ReactElement, useCallback, useRef, useState } from 'react';
import { numberFormat, useTranslate } from 'i18n-calypso';
import formatCurrency from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import { Button, Card } from '@automattic/components';
import Tooltip from 'calypso/components/tooltip';
import Gridicon from 'calypso/components/gridicon';

/**
 * Style dependencies
 */
import './style.scss';

function CostTooltip(): ReactElement {
	const translate = useTranslate();
	const tooltip = useRef< SVGSVGElement >( null );
	const [ isOpen, setIsOpen ] = useState( false );

	const open = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const close = useCallback( () => setIsOpen( false ), [ setIsOpen ] );

	return (
		<>
			<Button borderless className="billing-summary__open-cost-tooltip" onClick={ open }>
				<Gridicon ref={ tooltip } icon="info-outline" size={ 24 } />
			</Button>

			<Tooltip
				className="billing-summary__cost-tooltip"
				context={ tooltip.current }
				isVisible={ isOpen }
				position="bottom"
				showOnMobile
			>
				<div>
					<p>
						{ translate(
							'The total cost is being calculated based on the current date as well as the number of licenses in total.'
						) }
					</p>

					<Button
						borderless
						compact
						className="billing-summary__close-cost-tooltip"
						onClick={ close }
					>
						<Gridicon icon="cross" size={ 18 } />
					</Button>
				</div>
			</Tooltip>
		</>
	);
}

export default function BillingSummary(): ReactElement {
	const translate = useTranslate();

	return (
		<Card className="billing-summary">
			<div className="billing-summary__stat billing-summary__total-licenses">
				<span className="billing-summary__label">{ translate( 'Total licenses' ) }</span>
				<strong className="billing-summary__value">{ numberFormat( 1348, 0 ) }</strong>
			</div>

			<div className="billing-summary__stat billing-summary__assigned-licenses">
				<span className="billing-summary__label">{ translate( 'Assigned licenses' ) }</span>
				<strong className="billing-summary__value">{ numberFormat( 1324, 0 ) }</strong>
			</div>

			<div className="billing-summary__stat billing-summary__unassigned-licenses">
				<span className="billing-summary__label">{ translate( 'Unassigned licenses' ) }</span>
				<strong className="billing-summary__value">{ numberFormat( 24, 0 ) }</strong>
			</div>

			<div className="billing-summary__stat billing-summary__cost">
				<span className="billing-summary__label">
					<CostTooltip />
					{ translate( 'Cost for %(date)s', { args: { date: 'March, 2021' } } ) }
				</span>
				<strong className="billing-summary__value">{ formatCurrency( 177916, 'USD' ) }</strong>
			</div>
		</Card>
	);
}
