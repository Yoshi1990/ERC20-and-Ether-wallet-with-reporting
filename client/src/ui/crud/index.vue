<template>
	<div class="crud-index scrollable">
		<!-- Header with filters and buttons -->
		<div class="crud-index__header">
			<slot name="header">
				<div class="crud-index__header__filters">
					<template v-for="filter of filters">
						<!-- Filters from url query (ex: ?user_id=12, shows a filter 'User: blunt') -->
						<template v-if="filter.type === 'query'">
							<div v-if="$route.query[filter.name]" :key="filter.name">
								{{ filter.text }}
								<router-link :to="{ query: queryWithout(filter.name) }">X</router-link>
							</div>
						</template>
						
						<!-- Others -->
						<ui-input v-else :key="filter.name" :type="filter.type" v-model="filters_data[filter.name]" :options="filter.options" :class="filter.class"></ui-input>
					</template>
				</div>
				<div class="crud-index__headers__buttons">
					<!-- Reset filter button if filters -->
					<button type="button" class="btn btn-danger" v-if="filters.length" @click="resetFilters">Reset filters</button>

					<!-- Other buttons -->
					<slot name="buttons">
						<router-link :to="{ path: baseUrl + '/create', query }">Add</router-link>
					</slot>
				</div>
			</slot>
		</div>

		<!-- Global errors -->
		<ui-error :data="errors.global" :retry="retry"></ui-error>

		<!-- First time list loading -->
		<div v-if="!list && loading">
			<div class="loader big"></div>
		</div>

		<!-- Table header -->
		<template v-else-if="list">
			<transition name="fade-top" appear>
				<slot name="table-header">
					<div class="fake-table">
						<!-- Header -->
						<div class="fake-th">
							<div
								v-for="(column, i) in columns"
								:key="i"
								:style="columnStyle(column.size)"
								class="text-truncate">
								<component
									v-if="typeof column.title == 'object' && typeof column.title.render == 'function'" :is="column.title"
									:model="model"
									:options="column.titleOptions"
									@update:errors="err => errors = err"
								></component>
								<template
									v-else-if="typeof column.title == 'function'"
								>{{ column.title(list) }}</template>
								<template v-else>{{ column.title }}</template>
							</div>
							<div :style="columnStyle(1)" v-if="!noActionButtons"></div>
						</div>

						<!-- No records -->
						<transition name="fade">
							<slot v-if="!list || !list.results || list.results.length == 0" name="missing">
								<div class="fake-tr"><div>No more records</div></div>
							</slot>
						</transition>
					</div>
				</slot>
			</transition>
		</template>

		<!-- Table content -->
		<template v-if="list">
			<transition name="fade-top" appear>
				<slot name="table-content" :list="list" :loading="loading">
					<div class="fake-table scrollable__content">
						<!-- Loading -->
						<div class="loader big" v-if="loading"></div>
						
						<!-- Rows -->
						<transition name="fade">
							<template v-if="!loading && list && list.results && list.results.length > 0">
								<transition-group name="list" tag="div">
									<div
										v-for="model in list.results"
										:key="model.id"
										@click="setSelected(selected_id === model.id ? null : model.id)"
										class="fake-tr"
										:class="selected_id === model.id ? 'info' : ''">
										<div
											v-for="(column, i) in columns"
											:key="i"
											:style="columnStyle(column.size)"
											class="text-truncate">
											<component
												v-if="typeof column.value == 'object' && typeof column.value.render == 'function'"
												:is="column.value"
												:model="model"
												:options="column.valueOptions"
												:list="list"
												@update:errors="err => errors = err"
											/>
											<template
												v-else-if="typeof column.value == 'function'"
											>{{ column.value(model) }}</template>
											<template v-else>{{ model[column.value] }}</template>
										</div>

										<!-- Buttons -->
										<div :style="columnStyle(1)" v-if="!noActionButtons" class="text-right">
											<slot name="extra-actions" :model="model"></slot>
											<router-link :to="{ path: baseUrl+'/edit/'+model.id, query }" v-if="!canEdit || canEdit(model)">edit</router-link>
											<!--TODO: delete-button :class="{ loading: model.deleting }" @confirm="remove(model)" v-if="!canDelete || canDelete(model)">delete</delete-button-->
										</div>
									</div>
								</transition-group>
							</template>
						</transition>
					</div>
				</slot>
			</transition>
			<transition name="slide-bot" appear>
				<slot name="footer">
					<ui-pagination
						v-if="paginate"
						@input="setPage"
						:value="list.current"
						:last-page="list ? Math.ceil(list.total / list.per_page) : 0"
					></ui-pagination>
				</slot>
			</transition>
		</template>
	</div>
</template>

<script>
export default {
	data: () => ({
		loading: true,
		list: null,
		errors: {},
		retry: null,
		filters_data: {},
		selected_id: null,
	}),
	props: {
		// Base api urls
		api: { type: String, required: true },
		// Base for route urls
		baseUrl: { type: String, required: true },
		// Function (model) return true if you can edit it
		canEdit: Function,
		// Function (model) return true if you can delete it
		canDelete: Function,
		/*
		 Array of objects { title, value, titleOptions, valueOptions }
		 title can be:
			 - a string, ex: 'Firstname',
			- a function, ex: list => 'Total' + list.total
			- a component with the prop 'list'
		 value can be:
				- a string, ex: 'firstname', it will then show model.firstname
			- a function, ex: model => model.firstname.toLowerCase()
			- a component with the prop 'model'
		 In case of components, titleOptions and valueOptions are set as 'options' props on the component
		 */
		columns: { type: Array, required: true },
		// Use the attribute size on columns data, to size the table (like flex do)
		useColumnSize: { type: Boolean, default: true },
		// Extra parameters for listing api
		query: { type: Object },
		// Disable action buttons in the table rows
		noActionButtons: { type: Boolean, default: false },
		// Filters definition
		// [{ type: 'select,date,text,etc', name, ...input-line props }, ..]
		filters: {
			type: Array,
			default: () => ([]),
		},
		paginate: {
			type: Boolean,
			default: false,
		}
	},
	beforeMount() {
		if (this.filters.length) {
			// Reload filters from localStorage
			try {
				let data = window.localStorage.getItem('filters' + this.baseUrl)
				data = JSON.parse(data)
				if (data) {
					// Fix query filters
					for (let filter of this.filters) {
						if (filter.type === 'query') {
							data[filter.name] = this.$route.query[filter.name]
						}
					}
					this.filters_data = data
				}
			} catch (e) {} // eslint-disable-line no-empty
			
			// Reset filters
			if (!this.filters_data) {
				this.resetFilters()
			}
			
			// Watch all query filter
			for (let filter of this.filters) {
				if (filter.type === 'query') {
					//TODO: unwatch
					this.$watch('$route.query.' + filter.name, val => {
						this.filters_data[filter.name] = val
					})
				}
			}
		} else {
			this.load(1)
		}
	},
	methods: {
		// Load the list
		load(page = 1) {
			this.setSelected(null)
			let params = { page, ...this.filters_data, ...this.query }

			this.loading = true
			return this.$http.get(this.api, { params }).then(
				res => {
					this.setList(res.data)
					this.setErrors(this.loading = false)
				},
				error => {
					this.loading = false
					this.setErrors(error.response.data, () => this.load(page))
				}
			)
		},
		// Delete a model
		remove(model) {
			this.$set(model, 'deleting', true)
			return this.$http.delete(this.api + '/' + model.id).then(
				() => {
					this.setErrors(model.deleting = false)

					if (!this.list.results) return
					let data = this.list.results
					let index = data.indexOf(model)
					if (index !== -1) data.splice(index, 1)
					this.setList(this.list)
				},
				error => {
					model.deleting = false
					this.setErrors(error.response.data, () => this.remove(model))
				}
			)
		},
		// Set the list and dispatch an update:extra with list.extra, then a update:list event
		setList(list) {
			if (list.extra) {
				this.$emit('update:extra', list.extra)
				delete list.extra
			}
			if (!this.paginate) {
				list = { results: list }
			}

			this.list = list
			this.$emit('update:list', list)
		},
		// Set the error and dispatch update:errors
		setErrors(errors, retry) {
			this.errors = errors
			if (errors && errors.global && retry) {
				this.retry = retry
			} else {
				this.retry = null
			}
			this.$emit('update:errors', errors)
		},
		// Style css for columns
		columnStyle(size) {
			if (this.useColumnSize) {
				let p = (typeof size === 'number' ? size : 1) / this.total_size * 100
				if (p === 0) {
					return 'display: none'
				}
				return 'width:' + p + '%'
			}
			return ''
		},
		// Change query page
		setPage(page) {
			this.$router.push({
				query: {
					...this.$route.query,
					...{ page }
				}
			})
		},
		// Reset filters to default value
		resetFilters() {
			let res = {}
			for (let filter of this.filters) {
				if (!filter.default && filter.default !== 0) {
					res[filter.name] = ''
				} else if (filter.type === 'query') {
					res[filter.name] = this.$route.query[filter.name]
				} else {
					res[filter.name] = filter.default
				}
			}
			this.filters_data = res
		},
		// Filters have changed
		onFiltersChange() {
			this.$emit('filters', this.filters_data)
			
			// Reload
			let query = this.$route.query
			this.load(query.page || 1)
		},
		// Remove a query from the url
		queryWithout(name) {
			let query = { ...this.$route.query }
			delete query[name]
			return query
		},
		// Change the selected model
		setSelected(id) {
			id *= 1
			if (this.selected_id !== id) {
				this.selected_id = id
				
				if (this.list && this.list.results) {
					for (let model of this.list.results) {
						if (model.id === id) {
							this.$emit('select', model)
							break
						}
					}
				}
			}
		},
	},
	watch: {
		// Changed page, reload
		'$route.query.page'(page) {
			this.load(page)
		},
		// Changed query, reload
		query() {
			let query = this.$route.query
			this.load(query.page || 1)
		},
		// Save filters + reload
		filters_data: {
			handler(data) {
				try {
					if (this.filters) {
						window.localStorage.setItem('filters' + this.baseUrl, JSON.stringify(data))
					}
				} catch (e) {}	// eslint-disable-line no-empty
				this.onFiltersChange()
			},
			deep: true,
		},
	},
	computed: {
		// Total of all columns .size
		total_size() {
			let total = this.noActionButtons ? 0 : 1
			for (let column of this.columns) {
				total += typeof column.size === 'number' ? column.size : 1
			}
			return total
		},
	},
	components: {
		uiError: require('@/ui/error').default,
		uiInput: require('@/ui/input').default,
		uiPagination: require('@/ui/pagination').default,
	},
}
</script>

<style lang="scss">
.crud-index {
    &__header {
        &__filters {

        }
        &__buttons {

        }
    }
}
</style>