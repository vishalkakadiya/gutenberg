/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: InspectorControls, Slot } = createSlotFill( 'InspectorControls' );

InspectorControls.Slot = Slot;

export default InspectorControls;
