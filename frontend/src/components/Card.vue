<template>
    <div>
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
    </div>
</template>

<script>
    import axios from 'axios'
    export default {
        data() {
            return {
                url: 'http://fe-test.guardtime.com/documents',
            }
        },
        name: "card",
        methods: {
            async validateSingleDoc(id) {
                let modes = ['validateChecksum', 'validateSchema', 'validateSignature'],
                    docObjectById = what => this.$store.state.dataItems.find(element => element.id === what),
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
                                // console.log(error.response.data.error.code)
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
        computed: {
            dataItems() {
                return this.$store.state.dataItems;
            }
        }
    }
</script>

<style scoped>

</style>