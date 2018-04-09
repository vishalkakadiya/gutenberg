/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: InspectorAdvancedControls, Slot } = createSlotFill( 'InspectorAdvancedControls' );

InspectorAdvancedControls.Slot = Slot;

export default InspectorAdvancedControls;
