import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-pink-100 to-pink-50">
            {/* Top Navigation */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between p-4 border-b border-pink-200 sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm"
            >
                <motion.button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300 rounded-full transition-all"
                    aria-label="Go back"
                    data-testid="button-back"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={20} className="text-pink-700" />
                </motion.button>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent flex-1 text-center mr-10">
                    プライバシーポリシー
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-6 max-w-4xl mx-auto overflow-y-auto pb-8"
            >
                <motion.div 
                    className="text-left space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-pink-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {/* Article Header */}
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第1条（総則）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                ウェブサービスである「Only-U」（以下「本サービス」といいます。）を運営する合同会社SIN JAPAN KANAGAWA（以下「当社」といいます。）は、本サービスのユーザー（以下「ユーザー」という）のプライバシーを尊重し、ユーザーの個人情報およびその他のユーザーのプライバシーに係る情報（以下「プライバシー情報」といいます。）の管理に細心の注意を払います。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、個人情報保護法をはじめとする各法令およびその他の規範を遵守してユーザーから収集した個人情報を適切に取り扱います。また、当社は、個人情報を取り扱う体制の強化、SSL技術の導入等、ユーザーの個人情報の取り扱いについて、継続的な改善を図っています。
                            </p>
                        </li>

                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第2条（本ポリシーへの同意、同意の撤回）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                ユーザーは、問い合わせ又は会員登録を通じて当社に自身のプライバシー情報を提供する場合、本ポリシーを熟読し、その内容に同意するものとします。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、当社によるプライバシー情報の使用等について同意を撤回することができます。この場合、本サービスを継続利用することはできません。
                            </p>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">3.</span>
                            <p className="text-pink-900 leading-relaxed">
                                本条の本ポリシーへの同意および同意の撤回は、それぞれ当社が定める手段にてなされるものとします。
                            </p>
                        </li>
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">4.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、クッキー、IPアドレス、アクセスログ等のWEBトラッキング技術を活用してユーザーの行動や嗜好に関する情報を収集します。当社は、ユーザーが本サービスを利用した場合、当該ユーザーが当社によるこれらの技術を利用したプライバシー情報の収集について同意したものとみなします。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第3条（収集するプライバシー情報）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、本サービスの提供に際して、ユーザーから以下の情報を収集または取得します。
                                <br />
                                (1)ユーザーがフォーム等に入力することにより提供する情報：これには氏名、問い合わせ等に関する情報、メールアドレス、年齢または生年月日等が含まれます。
                                <br />
                                (2)クッキー、IPアドレス、アクセスログ等のWEBトラッキング技術、アクセス解析ツール等を介して当社がユーザーから収集する情報：これには利用端末やOS、ブラウザ等の接続環境に関する情報、ユーザーの行動履歴や閲覧履歴等に関する情報、購入した商品や閲覧した商品等のユーザーの嗜好に関する情報およびクッキー情報が含まれます。なお、これらの情報にはユーザー個人を特定しうる個人情報に該当する情報は、含まれません。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、適法かつ公正な手段によってプライバシー情報を入手し、ユーザーの意思に反する不正な入手をしません。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第4条（プライバシー情報の利用目的）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0"></span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、ユーザーから収集したプライバシー情報を本サービスの運営の目的のために使用します。主な利用目的は、以下のとおりです。
                                <br />
                                (1)料金請求、本人確認、認証のため
                                <br />
                                (2)本人確認のため
                                <br />
                                (3)ユーザー投稿コンテンツの決済のため
                                <br />
                                (4)売上金の振込のため
                                <br />
                                (5)利用規約やポリシーの変更等の重要な通知を送信するため
                                <br />
                                (6)本サービスのコンテンツやサービスの内容や品質の向上に役立てるため
                                <br />
                                (7)アンケート、懸賞、キャンペーン等の実施のため
                                <br />
                                (8)マーケティング調査、統計、分析のため
                                <br />
                                (9)システムメンテナンス、不具合対応のため
                                <br />
                                (10)広告の配信およびその成果確認のため
                                <br />
                                (11)技術サポートの提供、お客様からの問い合わせ対応のため
                                <br />
                                (12)ターゲットを絞った当社または第三者の商品またはサービスの広告の開発、提供のため
                                <br />
                                (13)不正行為または違法となる可能性のある行為を防止するため
                                <br />
                                (14)クレーム、紛争・訴訟等の対応のため
                            </div>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第5条（プライバシー情報の第三者提供）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、ユーザーの個人情報を第三者に開示または提供する場合、その提供先・提供情報内容を開示し、ユーザー本人の同意を得るものとします。なお、当社は、以下の場合を除き、ユーザー本人の事前の同意を得ることなく、個人情報を第三者に開示または提供することはありません。
                                <br />
                                (1)法令等の定めに基づいて開示等を請求された場合
                                <br />
                                (2)弁護士、検察、警察等から捜査に必要な範囲で開示等を請求された場合
                                <br />
                                (3)当社の関連会社間で情報を共有する場合
                                <br />
                                (4)本サービスの提供に必要な範囲で第三者に業務の一部を委託する場合
                                <br />
                                (5)本サービスの提供に必要な範囲内で決済代行会社に情報を提供する必要がある場合
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、個人情報の取り扱いを第三者に委託する場合、個人情報保護法に従って、委託先に対する必要かつ適切な監督を行います。
                            </p>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">3.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、合併や分割等で当社の事業を第三者に譲渡する場合または本サービスの一部または全部を第三者に譲渡する場合、本サービスに係るユーザーの個人情報等を当該第三者に提供します。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第6条（プライバシー情報の管理、保管期間）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、ユーザーが本サービスを利用している期間中、当該ユーザーから開示または提供されたプライバシー情報の漏洩、改ざん等を防止するため、現時点での技術水準に合わせた必要かつ適切な安全管理措置を講じます。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、当社が保管するプライバシー情報を利用する必要がなくなった場合、当該プライバシー情報を遅滞なく消去するよう努めるものとします。また、ユーザーよりプライバシー情報の削除を要求された場合も、同様とします。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第7条（ユーザーによる照会等への対応）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                ユーザーは、当社に対して、当社が保有する自身のプライバシー情報の開示、訂正、追加または削除、および利用停止を請求することができます。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、当社が定める手段によって前項の開示等の請求をするものとします。なお、同請求は、ユーザー本人、法定代理人（ユーザーが未成年者または成年被後見人である場合）または当該請求につきユーザー本人より委任された代理人のみすることができます。
                            </p>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">3.</span>
                            <p className="text-pink-900 leading-relaxed">
                                当社は、開示等の請求を受けた場合、当社が定める手段によって本人確認したうえで、相当な期間内にこれに対応します。なお、当社は、法令に基づき開示等をしない決定をした場合、その旨をユーザーに通知するものとします。
                            </p>
                        </li>
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">4.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、プライバシー情報の開示等に際して、以下に定める手数料を支払わなければなりません。
                                <br />
                                開示、照会、追加、訂正および削除請求にかかる手数料額：５００円＋送料
                                <br />
                                ※原則的に簡易書留（送料３９２円）にて発送します。
                            </p>
                        </li>
                    </ol>

                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第8条（解析ツール等の使用）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、アクセス解析ツールを使用してユーザーの行動履歴等に関する情報を収集します。また、本サービスの提供に係るウェブサイト上に掲載される広告等の一部は、クッキーを利用した第三者の運営するサービスを利用して表示されます。なお、Googleが提供するサービスについては、Googleのプライバシーポリシーが適用されます。Googleのプライバシーポリシーについては、下記のリンク先をご確認ください。
                                <br />
                                <a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline hover:text-pink-700 transition-colors" data-testid="link-google-privacy">
                                    https://policies.google.com/privacy?hl=ja
                                </a>
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、1)自身のブラウザ設定等からクッキーを無効にする、2)それぞれの解析ツール、行動ターゲティング広告システムに係るWEBページからオプトアウトする、等の手段により当社によるプライバシー情報の収集を拒否するまたは行動ターゲティング広告を非表示にすることができます。
                            </p>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">3.</span>
                            <p className="text-pink-900 leading-relaxed">
                                前項の設定の変更等は、ユーザー自身の自己責任にてなされるものとし、当社は、設定を変更したこと等により一部の情報が閲覧できない等、ユーザーに損害が生じた場合でも、一切責任を負わないものとします。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第9条（本ポリシーの変更）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社は、自身の判断にて、本ポリシーを改定することができます。当社は、本ポリシーを改定する場合、緊急性がある場合を除き、事前に当社が適当であると判断する手段にてユーザーにその旨を通知するものとします。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                本ポリシーの改定は、改定後のプライバシーポリシーを本サービスにかかるWEBサイト上に掲載した時点で効力を生じるものとします。
                            </p>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">3.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、本ポリシーの改定に同意することができない場合、当社に対して、第７条に定める手段にて自身のプライバシー情報の削除を要求することができます。
                            </p>
                        </li>
                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第10条（合意管轄、準拠法）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                本ポリシーは、日本国法に準拠して解釈されるものとします。
                            </div>
                        </li>

                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">2.</span>
                            <p className="text-pink-900 leading-relaxed">
                                ユーザーは、本ポリシーに関連して紛争等が発生した場合、東京地方裁判所において第一審の裁判を行うことにあらかじめ同意するものとします。
                            </p>
                        </li>

                    </ol>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent mb-4">第11条（管理責任者）</h2>

                    {/* Article Content */}
                    <ol className="space-y-4">
                        <li className="flex">
                            <span className="text-pink-800 font-medium mr-2 flex-shrink-0">1.</span>
                            <div className="text-pink-900 leading-relaxed">
                                当社では、個人情報の管理責任者を以下の者として、個人情報の適正な管理および個人情報保護に関する施策の継続的な改善を実施しています。なお、個人情報に関するお問い合わせ、ご相談、第７条の開示等の請求の窓口もこちらをご利用ください。
                                <br />
                                運営者: 合同会社SIN JAPAN KANAGAWA
                                <br />
                                窓口となる部署: 個人情報担当窓口
                                <br />
                                メールアドレス: kanagawa@sinjapan.jp
                                <br />
                                開示等の請求の方法: メール、郵送
                            </div>
                        </li>
                    </ol>
                </motion.div>
                {/* Footer section */}
                <motion.div 
                    className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 rounded-xl mt-8 border border-pink-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <p className="text-sm text-pink-800">
                        最終更新日: 2025年10月10日<br />
                        本ポリシーに関するご質問は、{' '}
                        <a href="mailto:kanagawa@sinjapan.jp" className="text-pink-600 hover:text-pink-700 underline transition-colors" data-testid="link-email">
                            kanagawa@sinjapan.jp
                        </a>
                        までご連絡ください。
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicy;
