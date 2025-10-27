import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse = () => {
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
                    利用規約
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                        Only-U[オンリーユー]利用規約
                    </h1>

                    <p className="text-pink-900 leading-relaxed">
                        合同会社SIN JAPAN KANAGAWA（以下「弊社」といいます。）は、弊社が運営するウェブサイト及び弊社が運営するファンクラブサイトの提供サービスの利用について、以下のとおり規約（以下「本規約」といいます。）を定めます。本規約は、弊社とすべての利用者との間に適用されます。
                    </p>

                    <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">第１章 総則</h2>

                    <h3 className="font-semibold text-lg text-pink-800">第１条（定義）</h3>

                    <p className="leading-relaxed text-pink-900">
                        本規約では、以下のとおり用語を定義します。
                    </p>

                    <ol className="list-decimal pl-6 space-y-4 text-pink-900">
                        <li>
                            <strong className="text-pink-800">「本サイト」</strong><br />
                            弊社が運営する以下のURL配下のウェブサイトをいいます。 但し、 URLは弊社の都合により変更する場合があります。<br />
                            <a href="https://only-u.fun" target="_blank" rel="noopener noreferrer" className="text-pink-600 underline hover:text-pink-700 transition-colors" data-testid="link-website">
                                https://only-u.fun
                            </a>
                        </li>
                        <li>
                            <strong className="text-pink-800">「利用者」</strong><br />
                            本サイトを利用する個人をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「本サービス」</strong><br />
                            弊社が運営するファンクラブサイトの提供サービスをいいます。詳細は本規約第２章及び本サイト上で定めます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「会員」</strong><br />
                            本規約第２条に定める会員登録手続きを完了した利用者をいい、主催者と参加者で構成されます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「主催者」</strong><br />
                            映像送信型性風俗特殊営業（風俗営業等の規制及び業務の適正化等に関する法律第２条第８項）の届出を行い、本規約第２条に定める会員登録手続きを完了した利用者のうち、ファンクラブサイトの運営者として登録手続きを完了した個人の総称をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「参加者」</strong><br />
                            本規約第２条に定める会員登録手続きを完了した利用者のうち、ファンクラブサイトにおいて主催者が提供するサービスを利用する者として登録手続きを完了した個人の総称をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「コンテンツ」</strong><br />
                            主催者が参加者に提供する活動情報や日常のプライベートに関する動画、静止画、テキスト、コミュニケーションサービス等のデジタル情報をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「ファンクラブサイト」</strong><br />
                            主催者が参加者に向けて各種コンテンツを発信できるウェブサイトをいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「ファンクラブサイト利用契約」</strong><br />
                            参加者が各ファンクラブサイトの利用を申し込み、主催者の承諾を得た場合に、主催者と参加者との間で締結される契約をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「ファンクラブ会費」</strong><br />
                            ファンクラブサイト利用契約に基づいて発生する参加者が主催者に対し支払う費用をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「本システム」</strong><br />
                            本サイト及び本サービスを運営・稼動するために弊社が使用するハードウェア及びソフトウェアの総称をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「本規約等」</strong><br />
                            本規約、プライバシーポリシー及び本サイト上で弊社が定めた本サービス利用のための諸条件の総称をいいます。
                        </li>
                        <li>
                            <strong className="text-pink-800">「本契約」</strong><br />
                            本規約等に基づく弊社と利用者との契約をいいます。
                        </li>
                    </ol>

                    <h3 className="font-semibold text-lg text-pink-800 mt-6">第２条（会員登録）</h3>

                    <div className="leading-relaxed">
                        <ol className="list-decimal pl-6 space-y-4 text-pink-900">
                            <li>本サービスの会員登録手続きは、必ず利用者本人が行うものとします。未成年者（２０２２年４月１日以後は、１８歳に満たない者をいいます。）は、本サービスをご利用いただけません。</li>
                            <li>会員登録を希望する者（以下「会員登録希望者」といいます。）は、本サイト上の会員登録画面において、弊社の定める必要事項を入力し送信することで会員登録手続きを行うものとし、弊社が、これを承諾する旨の通知（電子メール等）をした時点で、弊社が会員登録希望者を会員として承諾したものとみなします。</li>
                            <li>会員登録希望者又は会員が次の各号のいずれか一つにでも該当する場合、弊社は前項の承諾を拒否し、又は承諾後に取り消すことができるものとします。</li>

                            <ul className="list-disc list-inside pl-6 space-y-2 text-pink-900">
                                <li>本サイト上で入力した情報に、虚偽の記載、誤記、記入漏れがある場合</li>
                                <li>実在しないことが判明した場合</li>
                                <li>すでに登録済みであることが判明した場合</li>
                                <li>過去において、本規約第２１条１項又は２項に基づく本サービスの利用停止や会員としての資格の取消処分を受けたことがある場合</li>
                                <li>未成年者が会員登録手続きをした場合</li>
                                <li>暴力団又はその構成員等の反社会的勢力であると弊社が判断した場合又は暴力団等の反社会的勢力と密接な関連性（会員登録希望者又は会員が反社会的勢力に法律上又は事実上支配されている場合や、会員登録希望者又は会員と反社会的勢力との間の取引関係が認められる場合等）を有すると弊社が判断した場合</li>
                                <li>その他、会員とすることが不適切であると弊社が判断した場合</li>
                            </ul>

                            <li>会員登録希望者は、会員登録手続きを行う際に、主催者又は参加者のいずれかを選択して登録するものとします。</li>
                            <li>主催者としての会員登録を希望する者は、当該会員登録申込により、映像送信型性風俗特殊営業の届出を行っていることについて、表明し保証するものとします。</li>
                            <li>会員登録後に本条３項の各号に該当することが判明した場合、弊社は会員登録手続きを取り消した上、本サービスの利用を停止できるものとします。</li>
                            <li>会員は本規約等に従うものとします。</li>
                        </ol>
                    </div>

                    <h3 className="font-semibold text-lg text-pink-800 mt-6">第３条（会員情報の変更）</h3>

                    <p className="leading-relaxed text-pink-900">
                        会員は、本規約第２条１項に基づく会員登録手続きの際に弊社に届け出た会員の氏名、所在地又は住所、電話番号、電子メールアドレス、その他の情報に変更又は訂正があった場合、速やかに弊社に通知するものとします。会員が会員情報の変更を通知していない場合又は遅滞した場合、これにより会員又は第三者に生じた一切の損害（通常損害、特別損害、直接損害、間接損害、逸失利益等）について弊社は何ら責任を負わないものとします。
                    </p>

                    <h3 className="font-semibold text-lg text-pink-800 mt-6">第４条（会員の地位承継）</h3>

                    <p className="leading-relaxed text-pink-900">
                        会員が個人の場合、本契約上の会員としての地位は相続の対象とはならないものとします。但し、既に発生しているファンクラブ会費の支払い義務は、会員の死亡により相続されるものとします。
                    </p>

                    <h3 className="font-semibold text-lg text-pink-800 mt-6">第５条（利用者への通知）</h3>

                    <div className="leading-relaxed">
                        <ol className="list-decimal pl-6 space-y-4 text-pink-900">
                            <li>弊社が利用者（会員を含みます。）に対し通知を行う必要がある場合、本サイト上に掲示をして行うことができるものとします。この場合、利用者の閲覧可能な状態でサーバに掲示内容の情報が保存された時点で通知の効果が生じるものとします。</li>
                            <li>弊社が会員に対し本サービスについて個別に通知を行う必要がある場合、当該会員が届け出た情報を利用して、弊社が適切と判断する方法により行うことができるものとします。これらの方法を採用した場合、弊社が当該会員に発信又は発送した時点で通知の効果が生じるものとします。なお、会員が本規約第３条に定める届出をしていない場合又は遅滞した場合であっても、弊社に届出がなされている連絡先に発信又は発送した時点で通知の効果が生じるものとします。</li>
                        </ol>
                    </div>

                    <h3 className="font-semibold text-lg text-pink-800 mt-6">第６条（本規約等の変更）</h3>

                    <div className="leading-relaxed">
                        <ol className="list-decimal pl-6 space-y-4 text-pink-900">
                            <li>次の各号のいずれかに該当する場合、本規約等の変更をすることにより、変更後の本規約等の条項について合意があったものとみなし、弊社は個別に利用者と合意をすることなく本契約等の内容を変更することができるものとします。</li>
                            <ol className="list-decimal pl-6 space-y-2 text-pink-900">
                                <li>本規約等の変更が利用者の一般の利益に適合する場合</li>
                                <li>本規約等の変更が本契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性、その他の変更に係る事情に照らして合理的なものである場合</li>
                            </ol>
                            <li>弊社は、本規約等の変更をするときは、その効力発生時期を定め、かつ、本規約等を変更する旨及び変更後の本規約等の内容並びにその効力発生時期をインターネットの利用（本サイトの利用を含みます。）その他の適切な方法により周知するものとします。</li>
                            <li>前項で定めた効力発生時期から変更後の本規約等が適用され、本契約の内容が変更されるものとします。</li>
                        </ol>
                    </div>

                    <motion.div 
                        className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 rounded-xl mt-8 border border-pink-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <p className="text-sm text-pink-800">
                            最終更新日: 2025年10月10日<br />
                            本規約に関するご質問は、{' '}
                            <a href="mailto:kanagawa@sinjapan.jp" className="text-pink-600 hover:text-pink-700 underline transition-colors" data-testid="link-email">
                                kanagawa@sinjapan.jp
                            </a>
                            までご連絡ください。
                        </p>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default TermsOfUse;
