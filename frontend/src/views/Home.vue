<template>
    <div>
        <v-container grid-list-lg>
            <v-layout row wrap>
                <div v-if="dataLoadingError" class="full-width">
                    <v-flex xs12>
                        <v-card color="blue-grey darken-2">
                            <v-card-text  class="text">
                                <p>{{ dataLoadingError }}</p>
                            </v-card-text>
                            <v-card-actions class="buttons">
                                <div class="button-wrapper"><v-btn @click="showData(true)" flat color="orange">Reload
                                </v-btn></div>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
                </div>
                <div v-else class="full-width">
                    <v-flex xs-12 v-if="!showDataLoader" class="button-wrapper">
                        <div><v-btn @click="validateAllDocs" flat color="lime">Validate all documents</v-btn></div>
                    </v-flex>
                    <card ref="cardComponent"></card>
                    <v-flex style="text-align: center" v-if="showDataLoader">
                        <div><v-icon>fas fa-circle-notch fa-spin</v-icon></div>
                    </v-flex>
                </div>
            </v-layout>
        </v-container>
    </div>
</template>

<script>
    import axios from 'axios'
    import card from '../components/Card.vue'
    export default {
        data() {
            return {
                dataLoadingError: '',
                dataCounter: 5,
                perPage: 5,
                page: 1,
                url: 'http://fe-test.guardtime.com/documents',
                alert: true,
                showDataLoader: false,
                startIndex: 0
            }
        },
        components: {'card': card},
        methods: {
            showData(state) {
                this.showDataLoader = true
                this.dataLoadingError = '';
                // Reload button appears, if data not loaded after 3 sec.
                // Speeds up testing, should be used in dev mode only.
                setTimeout(this.error504Handling, 3000);

                axios.get(this.url + '?perPage=' + this.perPage + '&page=' + this.page)
                .then((res) => {
                    this.showDataLoader = false
                    this.$store.state.dataItems = this.$store.state.dataItems.concat(res.data.data);
                })
                .catch((error) => {
                    if (state === true)  {
                        this.showDataLoader = false
                        this.showData(false)
                        console.log(error.response.data.error.code)
                    }
                })
            },
            infiniteScroll() {
                window.onscroll = () => {
                    let bottomOfWindow = (window.innerHeight + Math.ceil(window.pageYOffset)) >=
                        document.body.offsetHeight;

                    if (bottomOfWindow) {
                        this.page+=1;
                        this.showData(true)
                        this.dataCounter+=this.perPage;
                    }
                };
            },
            error504Handling() {
                this.showDataLoader = false
                if (this.$store.state.dataItems.length < 1) {
                    this.dataLoadingError = 'Service unavailable, please reload'
                }
            },
            validateAllDocs() {
                let that = this,
                    perIteration = 5;

                this.$store.state.dataItems.slice(that.startIndex, that.startIndex + perIteration)
                    .forEach(function(item) {
                        that.$refs.cardComponent.validateSingleDoc(item.id);
                });

                that.startIndex += perIteration;
                if (this.$store.state.dataItems.length > that.startIndex) {
                    setTimeout(that.$refs.cardComponent.validateAllDocs, 5500);
                } else {
                    that.startIndex = 0;
                }
            }
    },
    created() {
        this.showData(true);
    },
    mounted() {
        this.infiniteScroll();
    }
};
</script>
<style>
    .full-width {
        width: 100%;;
    }
    .text {
        color: #ddd;
    }
    .button-wrapper {
        text-align: right;
        width: 100%;
    }
    .buttons {
        background: #455A70;
    }
    .v-card__text {
        flex-wrap: wrap;
    }
    .flex .fa-check-circle {
        color: lime!important;
    }
    .flex .fa-times-circle  {
        color: orangered !important;
    }
    .fa-circle-notch {
        color: cyan!important;
    }
</style>
