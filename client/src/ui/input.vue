<template>
	<div class="input" :class="{ 'input--hasError': hasError }">
		<!-- Title -->
		<label v-if="title" :for="_uid">{{ title }}</label>

		<!-- Select -->
		<select
			v-if="type === 'select'"
			:id="_uid"
			:value="value"
			v-on="inputListeners"
			:disabled="disabled"
			:required="required">
			<option
				v-for="option in parsedOptions"
				:key="option.value"
				:value="option.value">
				{{ option.text }}
			</option>
			<option v-if="options.length === 0" value disabled>No option available</option>
		</select>

		<!-- Textarea -->
		<textarea
			v-else-if="type === 'textarea'"
			:id="_uid"
			:rows="rows"
			:placeholder="placeholder"
			:value="value"
			v-on="inputListeners"
			:disabled="disabled"
			:required="required"
			:maxlength="maxlength"></textarea>

		<!-- Checkbox -->
		<label v-else-if="type === 'checkbox'" class="input__label-checkbox">
			<input
				type="checkbox"
				:checked="value"
				v-on="inputListeners"
				:disabled="disabled"
				:required="required"
			/>
			<span v-html="placeholder"></span>
		</label>

		<!-- Radio buttons as buttons -->
		<div v-else-if="type === 'radio-buttons'" class="input__radio-buttons">
			<label v-for="option in parsedOptions" :key="option.value">
				<input
					type="radio"
					:value="option.value"
					:name="_uid"
					@input="$emit('input', option.value)"
					:checked="option.value === value">
				<ui-button @click="$emit('input', option.value)">{{ option.text }}</ui-button>
			</label>
		</div>

		<!-- Inputs -->
		<input
			v-else
			:id="_uid"
			:type="type"
			:value="value"
			v-on="inputListeners"
			:min="min"
			:max="max"
			:step="step"
			:placeholder="placeholder"
			:disabled="disabled"
			:maxlength="maxlength"
			:required="required"
		/>

		<!-- Error -->
		<ui-error class="input__error" v-if="hasError" :data="error"></ui-error>
	</div>
</template>

<script>
export default {
	props: {
		// Value
		value: {},
		// Input type
		type: { type: String, default: 'text' },
		// Error message
		error: {},
		// Title over the field
		title: String,

		// Values for the select
		options: [Array, Object],
		// Convert option element to value
		optionToValue: Function,
		// Convert option element to text content
		optionToText: Function,

		// Forwarded on the input field
		min: [Number, String],
		max: [Number, String],
		step: [Number, String],
		placeholder: String,
		disabled: Boolean,
		rows: { type: [Number, String], default: 4 },
		maxlength: [Number, String],
		required: Boolean,
	},
	computed: {
		hasError() {
			let err = this.error
			return !!err && !(Array.isArray(err) && err.length === 0)
		},
		// Forward all events to the input
		inputListeners() {
			let res = { ...this.$listeners }
			// Fix v-model
			res.input = ev => this.$emit('input', ev.target.value)
			return res
		},
		parsedOptions() {
			let options = this.options
			let optionToValue = this.optionToValue
			let optionToText = this.optionToText

			let res = []
			if (Array.isArray(options)) {
				for (let option of options) {
					res.push({
						value: optionToValue ? optionToValue(option) : option,
						text: optionToText ? optionToText(option) : option
					})
				}
			} else {
				for (let key in options) {
					res.push({
						value: optionToValue ? optionToValue(key) : key,
						text: optionToText ? optionToText(options[key]) : options[key]
					})
				}
			}
			return res
		},
	},
	components: {
		uiError: require('@/ui/error').default,
		uiButton: require('@/ui/button').default,
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.input {
	&--hasError {
		color: $danger;
		select, textarea, input {
			border-color: $danger;
		}
	}

	label {
		display: block;
		margin-bottom: $spacer / 3;
	}

	input, textarea, select {
		display: block;
		width: 100%;
		padding: $spacer / 2;
		border: 1px solid $secondary;
		border-radius: 4px;
		margin-bottom: $spacer;
	
		&:focus {
			border-color: darken($secondary, $color-interval);
			outline: none;
		}
	}

	input[type="checkbox"] {
		display: inline;
		transform: scale(1.2);
		margin-right: 1em;
		width: auto;
		margin-bottom: 0;
	}
	&__label-checkbox {
		margin: $spacer 0;
	}
	&__radio-buttons {
		display: flex;
		flex-wrap: wrap;

		label {
			margin: $spacer / 2;
			flex: 1 0;
		}
		input {
			display: none;
		}
		button {
			width: 100%;
			opacity: 0.5;
			transition: opacity $transition-duration;
		}
		input:checked + button {
			opacity: 1;
		}
	}
}
</style>