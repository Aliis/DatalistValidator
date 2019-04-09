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
                    <v-flex xs12 v-for="(item, index) in dataItems" v-bind:key="index">
                        <v-card color="blue-grey darken-2">
                            <v-card-title class="text">
                                <v-flex xs11>
                                    <div class="headline">{{ item.filename }}</div>
                                </v-flex>
                                <v-flex xs1 style="text-align: right;">
                                    <div v-if="item.valid === 'valid'"><v-icon>far fa-check-circle</v-icon></div>
                                    <div v-if="item.valid === 'notValid'"><v-icon>far fa-times-circle</v-icon></div>
                                    <div v-if="item.valid === 'validationInProgress'"><v-icon>fas fa-circle-notch
                                        fa-spin</v-icon></div>
                                </v-flex>
                            </v-card-title>
                            <v-card-text  class="text">
                                <div>ID {{ item.id}}</div><br>
                                <div>Checksum {{item.checksum}}</div>
                                <div>Schema {{item.schema}}</div>
                                <div>Signature {{item.signature}}</div>

                                <v-alert :value="true"
                                         v-model="item.gotErrorFromResponse"
                                         dismissible
                                         type="error"
                                >Validation failed, please revalidate
                                </v-alert>
                            </v-card-text>
                            <v-card-actions class="buttons">
                                <div class="button-wrapper"><v-btn @click="validateSingleDoc(item.id)"
                                                                   flat color="orange">Validate</v-btn></div>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
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
    export default {
        data() {
            return {
                dataItems: [],
                dataLoadingError: '',
                dataCounter: 5,
                perPage: 50,
                page: 1,
                url: 'http://fe-test.guardtime.com/documents',
                alert: true,
                showDataLoader: false,
                startIndex: 0
            }
        },
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
                    this.dataItems = this.dataItems.concat(res.data.data);
                })
                .catch((error) => {
                    if (state === true)  {
                        this.showDataLoader = false
                        this.showData(false)
                        console.log(error.response.data.error.code)
                    }
                })
            },
            async validateSingleDoc(id) {
                let modes = ['validateChecksum', 'validateSchema', 'validateSignature'],
                    docObjectById = what => this.dataItems.find(element => element.id === what),
                    docByID = docObjectById(id)

                if(docByID) {
                    this.initValues(docByID)
                    this.resetValues(docByID)

                    for(let i = 0; i < modes.length; i++) {
                        this.$set(docByID, 'valid',  'validationInProgress');
                        await axios.post(this.url + '/'+ id + '/' + modes[i])
                            .then((res) => {
                                if (!res.data.valid) {
                                    this.$set(docByID, 'gotFalseFromResponse',  true);
                                }
                                if (modes[i] === 'validateChecksum') {
                                    this.$set(docByID, 'checksum',  res.data.valid);
                                }
                                else if (modes[i] === 'validateSchema') {
                                    this.$set(docByID, 'schema',  res.data.valid);
                                }
                                else {
                                    this.$set(docByID, 'signature',  res.data.valid);
                                }
                            })
                            .catch((error) => {
                                this.$set(docByID, 'gotErrorFromResponse',  true);
                                console.log(error.response.data.error.code)
                            })
                        if (docByID.gotFalseFromResponse) {
                            this.$set(docByID, 'docValid',  false);
                            break;
                        }
                        if(docByID.gotErrorFromResponse) {
                            break;
                        }
                    }
                    if (docByID.gotErrorFromResponse) {
                        this.resetValues(docByID)
                    }
                    else {
                        if (docByID.docValid) {
                            this.$set(docByID, 'valid',  'valid');
                        }
                        else {
                            this.$set(docByID, 'valid',  'notValid');
                        }
                    }
                }
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
                if (this.dataItems.length < 1) {
                    this.dataLoadingError = 'Service unavailable, please reload'
                }
            },
            validateAllDocs() {
                let that = this,
                    perIteration = 5;

                this.dataItems.slice(that.startIndex, that.startIndex + perIteration)
                    .forEach(function(item) {
                        that.validateSingleDoc(item.id);
                });

                that.startIndex += perIteration;
                if (this.dataItems.length > that.startIndex) {
                    setTimeout(this.validateAllDocs, 5500);
                } else {
                    that.startIndex = 0;
                }
            },
            initValues(obj) {
                this.$set(obj, 'gotFalseFromResponse',  false);
                this.$set(obj, 'gotErrorFromResponse',  false);
                this.$set(obj, 'docValid',  true);
            },
            resetValues(obj) {
                this.$set(obj, 'checksum',  '');
                this.$set(obj, 'schema',  '');
                this.$set(obj, 'signature',  '');
                this.$set(obj, 'valid',  '');
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
