import { FC } from 'react'
import { RequireAuth } from '../../features/auth/require-auth'

const TestPage: FC = () => {
    return (
        <RequireAuth>
            <cover-l
                centered="stack-l"
                minHeight="calc(100vh - calc(var(--side-menu-mobile-header-height) + var(--s1)))"
            >
                <stack-l space="var(--s3)">
                    <stack-l space="var(--s2)">
                        <center-l>
                            <h2>Buttons</h2>
                        </center-l>

                        <cluster-l space="var(--s1)">
                            <center-l andText>
                                <stack-l space="var(--s1)">
                                    <p>Filled Buttons</p>
                                    <cluster-l justify="center" align="center">
                                        <sl-button>
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            default
                                        </sl-button>
                                        <sl-button variant="neutral">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            neutral
                                        </sl-button>
                                        <sl-button variant="warning">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            warning
                                        </sl-button>
                                        <sl-button variant="danger">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            danger
                                        </sl-button>

                                        <sl-button variant="success">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            success
                                        </sl-button>

                                        <sl-button variant="primary">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            primary
                                        </sl-button>
                                    </cluster-l>
                                </stack-l>
                            </center-l>

                            <center-l andText>
                                <stack-l space="var(--s1)">
                                    <p>Outlined Buttons</p>
                                    <cluster-l justify="center" align="center">
                                        <sl-button outline>
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            default
                                        </sl-button>
                                        <sl-button outline variant="neutral">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            neutral
                                        </sl-button>
                                        <sl-button outline variant="warning">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            warning
                                        </sl-button>
                                        <sl-button outline variant="danger">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            danger
                                        </sl-button>

                                        <sl-button outline variant="success">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            success
                                        </sl-button>

                                        <sl-button outline variant="primary">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            primary
                                        </sl-button>
                                    </cluster-l>
                                </stack-l>
                            </center-l>

                            <center-l andText>
                                <stack-l space="var(--s1)">
                                    <p>Disabled Buttons</p>
                                    <cluster-l justify="center" align="center">
                                        <sl-button disabled>
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            default
                                        </sl-button>
                                        <sl-button disabled variant="neutral">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            neutral
                                        </sl-button>
                                        <sl-button disabled variant="warning">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            warning
                                        </sl-button>
                                        <sl-button disabled variant="danger">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            danger
                                        </sl-button>

                                        <sl-button disabled variant="success">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            success
                                        </sl-button>

                                        <sl-button disabled variant="primary">
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            primary
                                        </sl-button>
                                    </cluster-l>
                                </stack-l>
                            </center-l>

                            <center-l andText>
                                <stack-l space="var(--s1)">
                                    <p>Disabled Outlined Buttons</p>
                                    <cluster-l justify="center" align="center">
                                        <sl-button disabled outline>
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            default
                                        </sl-button>
                                        <sl-button
                                            disabled
                                            outline
                                            variant="neutral"
                                        >
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            neutral
                                        </sl-button>
                                        <sl-button
                                            disabled
                                            outline
                                            variant="warning"
                                        >
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            warning
                                        </sl-button>
                                        <sl-button
                                            disabled
                                            outline
                                            variant="danger"
                                        >
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            danger
                                        </sl-button>

                                        <sl-button
                                            disabled
                                            outline
                                            variant="success"
                                        >
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            success
                                        </sl-button>

                                        <sl-button
                                            disabled
                                            outline
                                            variant="primary"
                                        >
                                            <sl-icon
                                                name="person"
                                                slot="prefix"
                                            ></sl-icon>
                                            primary
                                        </sl-button>
                                    </cluster-l>
                                </stack-l>
                            </center-l>
                        </cluster-l>
                    </stack-l>

                    <stack-l space="var(--s2)">
                        <center-l>
                            <h2>Icons</h2>
                        </center-l>
                        <cluster-l
                            space="var(--s2)"
                            justify="center"
                            align="center"
                        >
                            <div>
                                <sl-icon name="gear" />
                                <div>default</div>
                            </div>
                            <div>
                                <sl-icon name="gear-fill" variant="neutral" />
                                <div>neutral</div>
                            </div>
                            <div>
                                <sl-icon
                                    name="exclamation-triangle-fill"
                                    variant="warning"
                                />
                                <div>warning</div>
                            </div>
                            <div>
                                <sl-icon
                                    name="exclamation-octagon-fill"
                                    variant="danger"
                                />
                                <div>danger</div>
                            </div>
                            <div>
                                <sl-icon
                                    name="check-circle-fill"
                                    variant="success"
                                />
                                <div>success</div>
                            </div>
                            <div>
                                <sl-icon
                                    name="info-circle-fill"
                                    variant="primary"
                                />
                                <div>primary</div>
                            </div>
                        </cluster-l>
                    </stack-l>
                    <stack-l space="var(--s2)">
                        <center-l>
                            <h2>Icon Buttons</h2>
                        </center-l>
                        <cluster-l
                            space="var(--s2)"
                            justify="center"
                            align="center"
                        >
                            <div>
                                <sl-icon-button name="gear" />
                                <div>default</div>
                            </div>
                            <div>
                                <sl-icon-button
                                    name="gear-fill"
                                    variant="neutral"
                                />
                                <div>neutral</div>
                            </div>
                            <div>
                                <sl-icon-button
                                    name="exclamation-triangle-fill"
                                    variant="warning"
                                />
                                <div>warning</div>
                            </div>
                            <div>
                                <sl-icon-button
                                    name="exclamation-octagon-fill"
                                    variant="danger"
                                />
                                <div>danger</div>
                            </div>
                            <div>
                                <sl-icon-button
                                    name="check-circle-fill"
                                    variant="success"
                                />
                                <div>success</div>
                            </div>
                            <div>
                                <sl-icon-button
                                    name="info-circle-fill"
                                    variant="primary"
                                />
                                <div>primary</div>
                            </div>
                        </cluster-l>
                    </stack-l>
                </stack-l>
            </cover-l>
        </RequireAuth>
    )
}

export default TestPage
