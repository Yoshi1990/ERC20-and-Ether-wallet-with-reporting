<template>
	<div>
		<slot name="header"/>

		<!-- Global errors -->
		<error :msg="errors ? errors.global : ''" :retry="retry"/>

		<!-- Data for edition loading -->
		<div class="center-wrapper" v-if="loading" style="height: 100px">
			<div class="loader big"></div>
		</div>

		<!-- Form -->
		<form v-else @submit.prevent="save" :class="formClass">
			<fieldset>
				<slot name="inputs"/>

				<!-- Buttons -->
				<slot name="buttons">
					<div class="form-group">
						<button type="submit" class="btn btn-primary" :class="{ loading: saving}">Save</button>
						<delete-button :class="{ loading: deleting }" v-if="id && (!canDelete || canDelete(model))" @confirm="remove">Delete</delete-button>
					</div>
				</slot>
			</fieldset>
		</form>
	</div>
</template>

<script>
export default {
	name: 'crud-edit',
	data: () => ({
		loading: true,
		saving: false,
		deleting: false,
		retry: null,
	}),
	props: {
		// Id to load, from router
		id: [Number, String],
		// Hide delete button if not deletable
		canDelete: Function,
		// Base api url
		api: { type: String, required: true },
		// Form's class
		formClass: String,
		// Force data loading with url api/forceLoad
		forceLoad: String,
		// Custom function instead of router.back()
		onSuccess: Function,

		// .sync model data
		model: { type: Object, default: {} },
		// .sync errors
		errors: { type: [Object, String, Boolean], default: false },
	},
	mounted() {
		if (this.id || this.forceLoad) {
			return this.load(this.id || this.forceLoad)
		} else {
			this.setModel(this.model)
			this.loading = false
		}
	},
	methods: {
		// Load the model from the server
		load(id) {
			this.loading = true
			return this.$http.get(this.api + '/' + id).then(
				res => {
					this.setModel(res.data)
					this.setErrors(this.loading = false)
				},
				error => {
					this.loading = false
					this.setErrors(error.response.data, () => this.load(id))
				}
			)
		},
		// Save or create
		save() {
			this.saving = true
			return this.$http.post(this.api + (this.id ? '/' + this.id : ''), this.model).then(
				res => {
					this.setModel(res.data)
					this.setErrors(this.loading = false)

					if (this.onSuccess) this.onSuccess('save', res.data)
					else this.$router.back()
				},
				error => {
					this.saving = false
					this.setErrors(error.response.data, this.save)
				}
			)
		},
		// Delete a model
		remove() {
			this.deleting = true
			return this.$http.delete(this.api + '/' + this.id).then(
				res => {
					this.setErrors(this.loading = false)

					if (this.onSuccess) this.onSuccess('remove', res.data)
					else this.$router.back()
				},
				error => {
					this.deleting = false
					this.setErrors(error.response.data, this.remove)
				}
			)
		},
		// For .sync
		setModel(model) {
			if (model.extra) {
				this.$emit('update:extra', model.extra)
				delete model.extra
			}
			this.$emit('update:model', model)
		},
		setErrors(errors, retry) {
			if (errors && errors.global && retry) {
				this.retry = retry
			} else {
				this.retry = null
			}
			this.$emit('update:errors', errors)
		},
	},
}
</script>
